"""
User API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.schemas.user import UserResponse, UserWithFinancials, UserUpdate, UserProfile, UserCreate
from app.crud.user import (
    get_user, get_users, create_user, update_user, delete_user,
    get_team_profiles as crud_get_team_profiles,
    set_user_online, set_user_offline, set_user_busy, set_user_on_leave
)
from app.api.deps import get_current_user, get_current_user_optional
from app.models.user import User as UserModel
from app.models.company import Company
from datetime import datetime, timezone
from typing import Optional, List
import logging
import traceback

# ✅ FIX: Use __name__ not name
logger = logging.getLogger(__name__)
router = APIRouter(tags=["Users"])


# ==================== STATIC ROUTES ====================

@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: UserModel = Depends(get_current_user)
):
    """Get current authenticated user profile"""
    logger.info(f"📥 [GET /me] Fetching current user: {current_user.email}")
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    try:
        updated_user = update_user(db, current_user.id, user_update)
        if not updated_user:
            raise HTTPException(status_code=500, detail="Failed to update user")
        return updated_user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [PUT /me] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")


@router.get("/team-profiles", response_model=List[UserProfile])
async def get_team_profiles(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get simplified user profiles for Team Pulse Bar"""
    logger.info(f"📥 [GET /team-profiles] Fetching team profiles for: {current_user.email}")
    
    try:
        users = db.query(UserModel).filter(
            UserModel.company_id == current_user.company_id,
            UserModel.is_active == True
        ).options(
            joinedload(UserModel.company)
        ).all()
        
        logger.info(f"✅ Found {len(users)} users in company {current_user.company_id}")
        
        profiles = []
        for u in users:
            try:
                company_code = None
                if u.company:
                    company_code = getattr(u.company, 'company_code', None)
                
                profile_data = {
                    "id": str(u.id),
                    "username": u.username,
                    "full_name": u.full_name,
                    "role": u.role,
                    "status": u.status,
                    "capacity": 42,
                    "position": u.position or "",
                    "company_id": u.company_id,
                    "company_code": company_code,
                }
                
                profiles.append(profile_data)
                
            except Exception as e:
                logger.error(f"❌ Error processing user {u.id}: {str(e)}", exc_info=True)
                continue
        
        logger.info(f"📤 [GET /team-profiles] Success - Returning {len(profiles)} profiles")
        return profiles
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [GET /team-profiles] Exception: {str(e)}", exc_info=True)
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch team profiles: {str(e)}"
        )


@router.post("/me/heartbeat")
async def heartbeat(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Keep user status as ACTIVE"""
    try:
        current_user.status = "ACTIVE"
        db.commit()
        
        return {
            "status": "active",
            "user_id": current_user.id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"❌ [POST /me/heartbeat] Error: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")


@router.put("/me/status")
async def update_my_status(
    new_status: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually update user status"""
    valid_statuses = ["ACTIVE", "OFFLINE", "BUSY", "ON_LEAVE"]
    
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {valid_statuses}"
        )
    
    try:
        current_user.status = new_status
        db.commit()
        db.refresh(current_user)
        
        return {
            "user_id": current_user.id,
            "status": current_user.status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"❌ [PUT /me/status] Error: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")


# ==================== DYNAMIC ROUTES ====================

@router.get("/{user_id}", response_model=UserResponse)
async def read_user(
    user_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user by ID"""
    try:
        db_user = get_user(db, user_id)
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_role = current_user.role.lower()
        
        if user_role == "member" and current_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own profile"
            )
        
        if user_role != "super_admin" and current_user.company_id != db_user.company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view users in your company"
            )
        
        return db_user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [GET /{user_id}] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch user: {str(e)}")


@router.get("/", response_model=List[UserResponse])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    company_id: Optional[int] = None,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List users"""
    try:
        user_role = current_user.role.lower()
        
        if user_role in ["super_admin", "admin"]:
            query_company_id = current_user.company_id
        else:
            return [UserResponse.model_validate(current_user)]
        
        if company_id and user_role == "super_admin":
            query_company_id = company_id
        
        users = get_users(db, company_id=query_company_id, skip=skip, limit=limit)
        return [UserResponse.model_validate(u) for u in users]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [GET /] Error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch users: {str(e)}"
        )


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_new_user(
    user_create: UserCreate,
    request: Request,
    current_user: Optional[UserModel] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Create a new user"""
    try:
        all_users = db.query(UserModel).all()
        
        if not all_users:
            if user_create.role != "super_admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="First user must be a SuperAdmin"
                )
            
            company = db.query(Company).filter(Company.id == user_create.company_id).first()
            if not company:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Company {user_create.company_id} not found"
                )
            
            db_user = create_user(db, user_create)
            return UserResponse.model_validate(db_user)
        
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated"
            )
        
        user_role = current_user.role.lower()
        
        if user_role not in ["super_admin", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only SuperAdmin and Admin can create users"
            )
        
        user_create.company_id = current_user.company_id
        
        if user_role == "admin" and user_create.role not in ["member"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admins can only create member accounts"
            )
        
        if user_role == "super_admin" and user_create.role == "admin":
            user_create.parent_id = current_user.id
        
        db_user = create_user(db, user_create)
        return UserResponse.model_validate(db_user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [POST /] Error: {str(e)}", exc_info=True)
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user_endpoint(
    user_id: str,
    user_update: UserUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user"""
    try:
        db_user = get_user(db, user_id)
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_role = current_user.role.lower()
        
        if user_role == "member" and current_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own profile"
            )
        
        if user_role != "super_admin" and current_user.company_id != db_user.company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update users in your company"
            )
        
        if user_role == "admin":
            update_data = user_update.model_dump(exclude={"salary", "payment_rate", "confidential_notes"})
            user_update = UserUpdate(**update_data)
        
        if user_role == "member":
            update_data = user_update.model_dump(exclude={
                "salary", "payment_rate", "confidential_notes",
                "role", "parent_id", "company_id"
            })
            user_update = UserUpdate(**update_data)
        
        updated_user = update_user(db, user_id, user_update)
        if not updated_user:
            raise HTTPException(status_code=500, detail="Failed to update user")
        
        return UserResponse.model_validate(updated_user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [PUT /{user_id}] Error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user: {str(e)}"
        )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_endpoint(
    user_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a user (SuperAdmin only)"""
    try:
        if current_user.role.lower() != "super_admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only SuperAdmin can delete users"
            )
        
        db_user = get_user(db, user_id)
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if current_user.company_id != db_user.company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete users in your company"
            )
        
        success = delete_user(db, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="User not found")
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [DELETE /{user_id}] Error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )