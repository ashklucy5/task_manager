# app/api/endpoints/companies.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone, timedelta
from typing import Optional
import logging
import traceback

from app.database import get_db
from app.models.company import Company
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyResponse
from app.schemas.user import UserCreate as SchemaUserCreate, UserResponse
from app.core.security import get_password_hash, create_access_token
from app.utils.id_generator import generate_user_id
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Companies"])


# ==================== SCHEMAS ====================

class AdminCreate(BaseModel):
    """Schema for creating the first SuperAdmin"""
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8)
    position: str = Field(..., min_length=1, max_length=100)
    salary: Optional[int] = None
    payment_rate: Optional[int] = None


class CompanyWithAdminCreate(BaseModel):
    """Schema for creating company + first SuperAdmin together"""
    company: CompanyCreate
    admin: AdminCreate


class CompanyWithAdminResponse(BaseModel):
    """Response with company, admin, and auth token"""
    company: CompanyResponse
    admin: UserResponse
    access_token: str
    token_type: str = "bearer"

    model_config = {"from_attributes": True}


# ==================== ENDPOINTS ====================

@router.post("/with-admin", response_model=CompanyWithAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_company_with_admin(
    request: CompanyWithAdminCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new company AND its first SuperAdmin in one atomic transaction.
    If anything fails, BOTH are rolled back.
    """
    logger.info(f"🔵 [POST /companies/with-admin] Starting company creation: {request.company.name}")
    
    try:
        # ========== VALIDATION ==========
        # Clean and validate inputs
        company_code_clean = request.company.code.strip().upper()
        admin_email_clean = request.admin.email.strip().lower()
        admin_position_clean = request.admin.position.strip().upper()
        
        logger.info(f"🔵 Validated inputs: code={company_code_clean}, email={admin_email_clean}")
        
        # Check if company code already exists
        existing_company = db.query(Company).filter(
            Company.code == company_code_clean
        ).first()
        if existing_company:
            logger.error(f"❌ Company code already exists: {company_code_clean}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Company with code '{company_code_clean}' already exists"
            )
        
        # Check if admin email already exists (case-insensitive)
        existing_user = db.query(User).filter(
            User.email == admin_email_clean
        ).first()
        if existing_user:
            logger.error(f"❌ Admin email already exists: {admin_email_clean}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"User with email '{admin_email_clean}' already exists"
            )
        
        # ========== CREATE COMPANY ==========
        logger.info(f"🔵 Creating company: {request.company.name}")
        company = Company(
            name=request.company.name.strip(),
            code=company_code_clean,
            description=request.company.description.strip() if request.company.description else None,
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(company)
        # Flush to get company.id WITHOUT committing yet
        db.flush()
        logger.info(f"✅ Company staged with ID: {company.id}")
        
        # Generate company_code (CA1, CA2, etc.)
        company_code = f"CA{company.id}"
        company.company_code = company_code
        logger.info(f"✅ Generated company_code: {company_code}")
        
        # ========== GENERATE SUPERADMIN ID ==========
        logger.info(f"🔵 Generating SuperAdmin ID for company {company.id}")
        try:
            structured_id = generate_user_id(
                db=db,
                role="super_admin",
                company_id=company.id,
                parent_id=None
            )
            logger.info(f"✅ Generated SuperAdmin ID: {structured_id}")
        except Exception as id_error:
            logger.error(f"❌ Failed to generate user ID: {str(id_error)}", exc_info=True)
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate user ID: {str(id_error)}"
            )
        
        # ========== CREATE SUPERADMIN USER ==========
        logger.info(f"🔵 Creating SuperAdmin user: {admin_email_clean}")
        try:
            hashed_pw = get_password_hash(request.admin.password)
            logger.info(f"✅ Password hashed successfully")
        except Exception as hash_error:
            logger.error(f"❌ Failed to hash password: {str(hash_error)}", exc_info=True)
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to hash password: {str(hash_error)}"
            )
        
        admin_user = User(
            id=structured_id,
            email=admin_email_clean,
            username=admin_email_clean,  # Auto-fill username from email
            full_name=request.admin.full_name.strip(),
            hashed_password=hashed_pw,
            role="super_admin",
            company_id=company.id,
            parent_id=None,  # SuperAdmin has no parent
            position=admin_position_clean,
            salary=request.admin.salary,
            payment_rate=request.admin.payment_rate,
            status="ACTIVE",
            is_active=True,
            is_verified=True,  # Auto-verify first admin
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        db.add(admin_user)
        logger.info(f"✅ SuperAdmin user staged")
        
        # ========== COMMIT BOTH IN SINGLE TRANSACTION ==========
        logger.info(f"🔵 Committing transaction (company + admin)")
        try:
            db.commit()
            db.refresh(company)
            db.refresh(admin_user)
            logger.info(f"✅ Transaction committed: Company {company.id}, Admin {admin_user.id}")
        except Exception as commit_error:
            logger.error(f"❌ Database commit failed: {str(commit_error)}", exc_info=True)
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save to database: {str(commit_error)}"
            )
        
        # ========== GENERATE JWT TOKEN ==========
        logger.info(f"🔵 Generating access token for SuperAdmin: {admin_user.id}")
        try:
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={
                    "sub": admin_user.username,
                    "user_id": admin_user.id,
                    "company_id": admin_user.company_id,
                    "company_code": company_code,
                    "role": admin_user.role,
                },
                expires_delta=access_token_expires
            )
            logger.info(f"✅ Access token generated")
        except Exception as token_error:
            logger.error(f"❌ Failed to generate access token: {str(token_error)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate access token: {str(token_error)}"
            )
        
        # ========== RETURN SUCCESS ==========
        logger.info(f"✅ [POST /companies/with-admin] SUCCESS: Company={company.id}, Admin={admin_user.id}")
        return {
            "company": company,
            "admin": admin_user,
            "access_token": access_token,
            "token_type": "bearer",
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions (already logged)
        logger.warning(f"⚠️ HTTPException raised: {str(HTTPException)}")
        raise
    except Exception as e:
        # Catch any unexpected errors
        logger.error(f"❌ [POST /companies/with-admin] UNEXPECTED ERROR: {str(e)}")
        logger.error(f"❌ Traceback:\n{traceback.format_exc()}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create company and admin: {str(e)}"
        )