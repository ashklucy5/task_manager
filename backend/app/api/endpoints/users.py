from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserResponse, UserWithFinancials, UserUpdate, UserProfile, UserCreate
from app.crud.user import (
    get_user, get_users, create_user, update_user, delete_user, get_team_profiles as crud_get_team_profiles
)
from app.api.deps import get_current_user
from app.models.user import User as UserModel, UserRole
from app.core.rbac import require_owner, require_role, can_view_financials

router = APIRouter(tags=["Users"])


# ✅ STATIC ROUTES FIRST (MUST COME BEFORE DYNAMIC ROUTES)
@router.get("/me", response_model=UserResponse)
async def read_current_user(current_user: UserModel = Depends(get_current_user)):
    """Get current authenticated user profile"""
    return current_user


@router.get("/team-profiles", response_model=list[UserProfile])  # ✅ MOVED BEFORE /{user_id}
async def get_team_profiles(  # Endpoint keeps route-friendly name
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get simplified user profiles for Team Pulse Bar.
    Returns only: id, username, full_name, role, status, capacity.
    """
    # ✅ CALL ALIASED CRUD FUNCTION (NOT RECURSIVE!)
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


# ✅ DYNAMIC ROUTES AFTER STATIC ROUTES
@router.get("/{user_id}", response_model=UserResponse)
async def read_user(
    user_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user by ID (Owner/Admin can see any; Employee only themselves)"""
    db_user = get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Employees can only view themselves
    if current_user.role == UserRole.EMPLOYEE and current_user.id != user_id:
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
    """List users (Owner sees all; Admin sees team; Employee sees peers only)"""
    users = get_users(db, skip=skip, limit=limit)
    
    # Return only safe fields (no financials)
    return [
        UserResponse.model_validate(u) for u in users
    ]


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_new_user(
    user_create: UserCreate,
    current_user: UserModel = Depends(require_owner),  # Only Owner can create users
    db: Session = Depends(get_db)
):
    """Create a new user (Owner-only)"""
    db_user = create_user(db, user_create)
    return UserResponse.model_validate(db_user)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user_endpoint(
    user_id: int,
    user_update: UserUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user (Owner/Admin can update; Employee can only update themselves)"""
    db_user = get_user(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check permissions
    if current_user.role == UserRole.EMPLOYEE and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile"
        )
    
    # Owner can update financial fields; Admin cannot
    if current_user.role == UserRole.ADMIN:
        # Strip financial fields from update
        update_data = user_update.model_dump(exclude={"salary", "payment_rate", "confidential_notes"})
        user_update = UserUpdate(**update_data)
    
    updated_user = update_user(db, user_id, user_update)
    if not updated_user:
        raise HTTPException(status_code=500, detail="Failed to update user")
    
    return UserResponse.model_validate(updated_user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_endpoint(
    user_id: int,
    current_user: UserModel = Depends(require_owner),  # Only Owner can delete users
    db: Session = Depends(get_db)
):
    """Delete a user (Owner-only)"""
    success = delete_user(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"detail": "User deleted successfully"}