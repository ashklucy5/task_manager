# app/api/endpoints/companies.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field  # ✅ ADDED: Pydantic imports
from datetime import datetime, timezone, timedelta  # ✅ ADDED: timedelta
from typing import Optional, Dict  # ✅ ADDED: Dict, Optional

from app.database import get_db
from app.models.company import Company
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyResponse
from app.schemas.user import UserCreate as SchemaUserCreate, UserResponse
from app.core.security import get_password_hash, create_access_token  # ✅ ADDED: create_access_token
from app.utils.id_generator import generate_user_id
from app.core.config import settings  # ✅ ADDED: for ACCESS_TOKEN_EXPIRE_MINUTES


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

    class Config:
        from_attributes = True


# ==================== ENDPOINTS ====================

@router.post("/with-admin", response_model=CompanyWithAdminResponse, status_code=status.HTTP_201_CREATED)
async def create_company_with_admin(
    request: CompanyWithAdminCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new company AND its first SuperAdmin in one request.
    Perfect for onboarding new organizations.
    """
    # 1. Check if company code already exists
    existing_company = db.query(Company).filter(
        Company.code == request.company.code
    ).first()
    
    if existing_company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Company with code '{request.company.code}' already exists"
        )
    
    # 2. Check if admin email already exists
    existing_user = db.query(User).filter(
        User.email == request.admin.email
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{request.admin.email}' already exists"
        )
    
    # 3. Create the company
    company = Company(
        name=request.company.name,
        code=request.company.code,
        description=request.company.description,
        is_active=True
    )
    
    db.add(company)
    db.commit()
    db.refresh(company)
    
    # 4. Generate company_code (CA1, CA2, etc.)
    company_code = f"CA{company.id}"
    company.company_code = company_code
    db.commit()
    db.refresh(company)
    
    # 5. Create the first SuperAdmin for this company
    # Generate structured ID
    structured_id = generate_user_id(
        db=db,
        role="super_admin",
        company_id=company.id,
        parent_id=None
    )
    
    admin_user = User(
        id=structured_id,
        email=request.admin.email,
        username=request.admin.email,  # Auto-fill username from email
        full_name=request.admin.full_name,
        hashed_password=get_password_hash(request.admin.password),
        role="super_admin",
        company_id=company.id,
        parent_id=None,
        position=request.admin.position,
        salary=request.admin.salary,
        payment_rate=request.admin.payment_rate,
        status="ACTIVE",
        is_active=True,
        is_verified=False
    )
    
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    # 6. Generate JWT token for immediate login
    access_token = create_access_token(
        data={
            "sub": admin_user.username,
            "user_id": admin_user.id,
            "company_id": admin_user.company_id,
            "company_code": company_code,
            "role": admin_user.role,
        }
    )
    
    return {
        "company": company,
        "admin": admin_user,
        "access_token": access_token,
        "token_type": "bearer",
    }