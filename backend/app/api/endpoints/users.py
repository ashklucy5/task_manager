from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserResponse, UserWithFinancials, UserUpdate, UserProfile, UserCreate
from app.crud.user import (
    get_user, get_users, create_user, update_user, delete_user,
    get_team_profiles as crud_get_team_profiles
)
from app.utils.image_storage import ImageStorageService
from app.api.deps import get_current_user
from app.models.user import User as UserModel
from typing import Optional

router = APIRouter(tags=["Users"])


# ==================== STATIC ROUTES (MUST COME BEFORE DYNAMIC) ====================

@router.get("/me", response_model=UserResponse)
async def read_current_user(
    current_user: UserModel = Depends(get_current_user)
):
    """Get current authenticated user profile"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile"""
    updated_user = update_user(db, current_user.id, user_update)
    if not updated_user:
        raise HTTPException(status_code=500, detail="Failed to update user")
    return updated_user


@router.get("/team-profiles", response_model=list[UserProfile])
async def get_team_profiles(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get simplified user profiles for Team Pulse Bar"""
    users = crud_get_team_profiles(db, current_user.role)
    profiles = []
    for u in users:
        capacity = 42 if u.id == 1 else 75 if u.id == 2 else 60
        profiles.append(UserProfile(
            id=u.id,
            username=u.username,
            full_name=u.full_name,
            role=u.role,
            status=u.status,
            capacity=capacity
        ))
    return profiles


# ==================== AVATAR ENDPOINTS (Dual Storage) ====================

@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload avatar with automatic fallback storage"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    file_bytes = await file.read()
    result = await ImageStorageService.upload_image(
        file_bytes=file_bytes,
        filename=file.filename,
        folder="avatars"
    )
    
    # Update user with storage info
    db_user = get_user(db, current_user.id)
    db_user.avatar_url = result["primary_url"]
    db_user.avatar_storage_provider = result["storage_provider"]
    
    # Store provider-specific IDs
    if result["storage_provider"] == "cloudinary":
        db_user.avatar_cloudinary_public_id = result["cloudinary_public_id"]
    elif result["storage_provider"] == "qiniu":
        db_user.avatar_qiniu_key = result["qiniu_key"]
    elif result["storage_provider"] == "local":
        db_user.avatar_local_path = result["local_path"]
    
    db.commit()
    db.refresh(db_user)
    
    return db_user


@router.delete("/me/avatar", response_model=UserResponse)
async def delete_avatar(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete avatar from both storage services"""
    db_user = get_user(db, current_user.id)
    
    if db_user.avatar_cloudinary_public_id or db_user.avatar_qiniu_key:
        await ImageStorageService.delete_image(
            cloudinary_public_id=db_user.avatar_cloudinary_public_id,
            qiniu_key=db_user.avatar_qiniu_key
        )
        
        db_user.avatar_url = None
        db_user.avatar_cloudinary_url = None
        db_user.avatar_qiniu_url = None
        db_user.avatar_cloudinary_public_id = None
        db_user.avatar_qiniu_key = None
        db.commit()
    
    return db_user


@router.get("/me/avatar-url")
async def get_avatar_url(
    current_user: UserModel = Depends(get_current_user),
    region: str = "auto"
):
    """Get optimized avatar URL based on region (global/china/auto)"""
    if not current_user.avatar_cloudinary_url and not current_user.avatar_qiniu_url:
        raise HTTPException(status_code=404, detail="No avatar found")
    
    if region == "china":
        url = current_user.avatar_qiniu_url or current_user.avatar_cloudinary_url
    elif region == "global":
        url = current_user.avatar_cloudinary_url or current_user.avatar_qiniu_url
    else:
        return {
            "global": current_user.avatar_cloudinary_url,
            "china": current_user.avatar_qiniu_url,
            "primary": current_user.avatar_url
        }
    
    return {"url": url}


# ==================== DYNAMIC ROUTES (AFTER STATIC) ====================

@router.get("/{user_id}", response_model=UserResponse)
async def read_user(
    user_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user by ID"""
    db_user = get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # String-based role check
    if current_user.role.lower() in ["member", "contributor", "employee"] and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own profile"
        )
    
    return db_user


@router.get("/", response_model=list[UserResponse])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List users"""
    users = get_users(db, skip=skip, limit=limit)
    return [UserResponse.model_validate(u) for u in users]


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_new_user(
    user_create: UserCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new user (Owner-only)"""
    if current_user.role.lower() != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    
    db_user = create_user(db, user_create)
    return UserResponse.model_validate(db_user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user_endpoint(
    user_id: int,
    user_update: UserUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user"""
    db_user = get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # String-based role check
    if current_user.role.lower() in ["member", "contributor", "employee"] and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile"
        )
    
    # Admin cannot update financial fields
    if current_user.role.lower() == "admin":
        update_data = user_update.model_dump(exclude={"salary", "payment_rate", "confidential_notes"})
        user_update = UserUpdate(**update_data)
    
    updated_user = update_user(db, user_id, user_update)
    if not updated_user:
        raise HTTPException(status_code=500, detail="Failed to update user")
    
    return UserResponse.model_validate(updated_user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_endpoint(
    user_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a user (Owner-only)"""
    if current_user.role.lower() != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    
    success = delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")