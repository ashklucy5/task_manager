"""
User API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
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
from app.core.security import verify_password, get_password_hash
from app.utils.image_storage import ImageStorageService

# ✅ FIX: Use __name__ not name
logger = logging.getLogger(__name__)
router = APIRouter(tags=["Users"])


# ==================== STATIC ROUTES ====================

@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current authenticated user profile with company info"""
    logger.info(f"📥 [GET /me] Fetching current user: {current_user.email}")
    
    # ✅ Get company info
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    
    # ✅ Create response dict with company info
    response_data = {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "company_id": current_user.company_id,
        "company_code": company.company_code if company else None,
        "company_name": company.name if company else None,  # ✅ Add company name
        "parent_id": current_user.parent_id,
        "position": current_user.position,
        "status": current_user.status,
        "avatar_url": current_user.avatar_url,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at,
    }
    
    return UserResponse(**response_data)


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    try:
        # ✅ Log what's being updated for debugging
        update_data = user_update.model_dump(exclude_unset=True, exclude_none=True)
        logger.info(f"🔵 [PUT /me] Updating user {current_user.id} with: {update_data}")
        
        updated_user = update_user(db, current_user.id, user_update)
        if not updated_user:
            raise HTTPException(status_code=500, detail="Failed to update user")
        
        logger.info(f"✅ [PUT /me] User {current_user.id} updated successfully")
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
    """Get simplified user profiles for Team Pulse Bar WITH online status"""
    try:
        from datetime import timedelta
        
        users = db.query(UserModel).filter(
            UserModel.company_id == current_user.company_id,
            UserModel.is_active == True
        ).options(
            joinedload(UserModel.company)
        ).all()
        
        profiles = []
        now = datetime.now(timezone.utc)
        
        for u in users:
            company_code = getattr(u.company, 'company_code', None) if u.company else None
            
            # ✅ Calculate is_online based on last_seen (within 2 minutes)
            is_online = False
            if u.last_seen:
                is_online = (now - u.last_seen) < timedelta(minutes=2)
            
            profile_data = {
                "id": str(u.id),
                "username": u.username,
                "full_name": u.full_name,
                "role": u.role,
                "status": u.status,  # ✅ Manual status (ACTIVE, BUSY, ON_LEAVE, OFFLINE)
                "capacity": 42,
                "position": u.position or "",
                "company_id": u.company_id,
                "company_code": company_code,
                "avatar_url": u.avatar_url,
                # ✅ NEW: Real-time online status from heartbeat
                "is_online": is_online,
                "last_seen": u.last_seen.isoformat() if u.last_seen else None,
            }
            
            profiles.append(profile_data)
        
        return profiles
        
    except Exception as e:
        logger.error(f"❌ [GET /team-profiles] Exception: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch team profiles: {str(e)}"
        )

@router.post("/me/heartbeat")
async def heartbeat(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Heartbeat endpoint - updates last_seen timestamp (NOT status).
    Called every 5 seconds by frontend to indicate user is online.
    """
    try:
        # ✅ Update last_seen (NOT status)
        current_user.last_seen = datetime.now(timezone.utc)
        db.commit()
        
        # ✅ Calculate is_online based on last_seen (within 2 minutes)
        from datetime import timedelta
        is_online = (datetime.now(timezone.utc) - current_user.last_seen) < timedelta(minutes=2)
        
        return {
            "status": "ok",
            "user_id": current_user.id,
            "is_online": is_online,  # ✅ Computed from last_seen
            "last_seen": current_user.last_seen.isoformat() if current_user.last_seen else None,
            "manual_status": current_user.status,  # ✅ Keep manual status separate
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"❌ [POST /me/heartbeat] Error: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update heartbeat: {str(e)}")

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


@router.post("/me/set-offline")
async def set_offline(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set user status to OFFLINE"""
    try:
        current_user.status = "OFFLINE"
        db.commit()
        
        return {
            "status": "offline",
            "user_id": current_user.id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"❌ [POST /me/set-offline] Error: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")


@router.put("/me/password", response_model=UserResponse)
async def update_my_password(
    password_update: dict,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's password"""
    try:
        # Verify current password
        if not verify_password(password_update['current_password'], current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Validate new password
        new_password = password_update['new_password']
        if len(new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters"
            )
        
        # Update password
        current_user.hashed_password = get_password_hash(new_password)
        db.commit()
        db.refresh(current_user)
        
        return UserResponse.model_validate(current_user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ [PUT /me/password] Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update password")


@router.post("/{user_id}/avatar", response_model=UserResponse)
async def upload_user_avatar(
    user_id: str,
    file: UploadFile = File(...),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload user avatar to Cloudinary (or fallback storage)"""
    
    # Permission check
    if current_user.role.lower() not in ["super_admin", "admin"] and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own avatar"
        )
    
    db_user = get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Read file bytes
    file_bytes = await file.read()
    
    # Upload using ImageStorageService
    result = await ImageStorageService.upload_image(
        file_bytes=file_bytes,
        filename=file.filename,
        folder="avatars"
    )
    
    if not result["primary_url"]:
        raise HTTPException(status_code=500, detail="Failed to upload image")
    
    # Update user with new avatar URLs
    db_user.avatar_url = result["primary_url"]
    db_user.avatar_cloudinary_public_id = result.get("cloudinary_public_id")
    db_user.avatar_cloudinary_url = result.get("cloudinary_url")
    db_user.avatar_qiniu_key = result.get("qiniu_key")
    db_user.avatar_qiniu_url = result.get("qiniu_url")
    db_user.avatar_storage_provider = result.get("storage_provider")
    
    db.commit()
    db.refresh(db_user)
    
    return UserResponse.model_validate(db_user)


@router.delete("/{user_id}/avatar", response_model=UserResponse)
async def delete_user_avatar(
    user_id: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user avatar from storage"""
    
    # Permission check
    if current_user.role.lower() not in ["super_admin", "admin"] and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own avatar"
        )
    
    db_user = get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete from storage provider
    if db_user.avatar_cloudinary_public_id and db_user.avatar_storage_provider == "cloudinary":
        await ImageStorageService.delete_image(
            cloudinary_public_id=db_user.avatar_cloudinary_public_id
        )
    elif db_user.avatar_qiniu_key and db_user.avatar_storage_provider == "qiniu":
        await ImageStorageService.delete_image(
            qiniu_key=db_user.avatar_qiniu_key
        )
    
    # Clear avatar fields
    db_user.avatar_url = None
    db_user.avatar_cloudinary_public_id = None
    db_user.avatar_cloudinary_url = None
    db_user.avatar_qiniu_key = None
    db_user.avatar_qiniu_url = None
    db_user.avatar_storage_provider = None
    
    db.commit()
    db.refresh(db_user)
    
    return UserResponse.model_validate(db_user)


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


@router.post("/logout")
async def logout(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout user and set status to OFFLINE"""
    set_user_offline(db, current_user.id)
    return {"message": "Successfully logged out", "status": "offline"}