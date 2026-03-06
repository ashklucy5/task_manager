from sqlalchemy.orm import Session
from app.models.user import User, UserStatus
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash
from typing import Optional, List
from passlib.context import CryptContext


# ✅ Password context (no circular import)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_user(db: Session, user_id: int) -> Optional[User]:
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get user by username"""
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    """Get all users"""
    return db.query(User).offset(skip).limit(limit).all()


def create_user(db: Session, user: UserCreate) -> User:
    """Create a new user"""
    db_user = User(
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        hashed_password=get_password_hash(user.password),
        role=user.role,  # ✅ Now string, not enum
        salary=user.salary,
        payment_rate=user.payment_rate,
        # ✅ New avatar fields (optional)
        avatar_url=None,
        avatar_filename=None
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
    """Update user information"""
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    # Update fields
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user_status(db: Session, user_id: int, status: str) -> Optional[User]:
    """Update user status (ACTIVE, OFFLINE, BUSY, ON_LEAVE)"""
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    # Validate status
    valid_statuses = [s.value for s in UserStatus]
    if status not in valid_statuses:
        raise ValueError(f"Invalid status. Must be one of: {valid_statuses}")
    
    db_user.status = status
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user_role(db: Session, user_id: int, new_role: str) -> Optional[User]:
    """Update user role (with audit logging support)"""
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    old_role = db_user.role
    db_user.role = new_role
    db.commit()
    db.refresh(db_user)
    
    # Return old and new role for audit logging
    return db_user


def update_user_avatar(db: Session, user_id: int, avatar_url: str, avatar_filename: str) -> Optional[User]:
    """Update user avatar"""
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    db_user.avatar_url = avatar_url
    db_user.avatar_filename = avatar_filename
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user_avatar(db: Session, user_id: int) -> Optional[User]:
    """Delete user avatar"""
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    db_user.avatar_url = None
    db_user.avatar_filename = None
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int) -> bool:
    """Delete a user"""
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    
    db.delete(db_user)
    db.commit()
    return True


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate user with username and password"""
    user = get_user_by_username(db, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password helper"""
    # ✅ FIXED: Direct verification, no circular import
    return pwd_context.verify(plain_password, hashed_password)


def get_team_profiles(db: Session, current_user_role: str) -> List[User]:
    """
    Get team profiles for Team Pulse Bar.
    Returns all users if Owner/Admin, otherwise returns limited info.
    """
    users = db.query(User).filter(User.is_active == True).all()
    
    # ✅ FIXED: String comparison instead of enum
    restricted_roles = ["member", "contributor", "participant", "employee"]
    
    if current_user_role.lower() in restricted_roles:
        # Return only basic info for regular members
        for user in users:
            # Clear sensitive fields
            user.salary = None
            user.payment_rate = None
            user.confidential_notes = None
    
    return users


def set_user_online(db: Session, user_id: int) -> Optional[User]:
    """Set user status to ACTIVE (on login)"""
    return update_user_status(db, user_id, UserStatus.ACTIVE.value)


def set_user_offline(db: Session, user_id: int) -> Optional[User]:
    """Set user status to OFFLINE (on logout)"""
    return update_user_status(db, user_id, UserStatus.OFFLINE.value)