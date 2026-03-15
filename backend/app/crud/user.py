"""
User CRUD Operations
Username auto-set to email if not provided
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.user import User  # ✅ REMOVED: UserStatus import
from app.models.company import Company
from app.schemas.user import UserCreate, UserUpdate
from app.utils.id_generator import generate_user_id
from app.core.security import get_password_hash, verify_password
from typing import Optional, List


def get_user(db: Session, user_id: str) -> Optional[User]:
    """Get user by structured ID"""
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get user by username"""
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()


def get_users(db: Session, company_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[User]:
    """Get users with optional company filter"""
    query = db.query(User)
    if company_id:
        query = query.filter(User.company_id == company_id)
    return query.offset(skip).limit(limit).all()


def get_subordinates(db: Session, user_id: str) -> List[User]:
    """Get direct subordinates of a user"""
    return db.query(User).filter(User.parent_id == user_id).all()


def create_user(db: Session, user: UserCreate) -> User:
    """
    Create a new user with structured hierarchical ID.
    Username auto-set to email if not provided.
    """
    # Verify company exists
    company = db.query(Company).filter(Company.id == user.company_id).first()
    if not company:
        raise ValueError(f"Company {user.company_id} does not exist")
    
    # Verify parent if required
    if user.role in ["admin", "member"] and not user.parent_id:
        raise ValueError(f"{user.role} must have a parent_id")
    
    if user.parent_id:
        parent = get_user(db, user.parent_id)
        if not parent:
            raise ValueError(f"Parent user {user.parent_id} does not exist")
        
        if user.role == "admin" and parent.role != "super_admin":
            raise ValueError("Admin must report to a SuperAdmin")
        if user.role == "member" and parent.role != "admin":
            raise ValueError("Member must report to an Admin")
    
    # ✅ Auto-set username to email if not provided
    username = user.username if user.username else user.email
    
    # Generate structured ID
    structured_id = generate_user_id(
        db=db,
        role=user.role,
        company_id=user.company_id,
        parent_id=user.parent_id
    )
    
    # Create user
    db_user = User(
        id=structured_id,
        email=user.email,
        username=username,
        full_name=user.full_name,
        hashed_password=get_password_hash(user.password),
        role=user.role,
        company_id=user.company_id,
        parent_id=user.parent_id,
        position=user.position,
        salary=user.salary,
        payment_rate=user.payment_rate,
        confidential_notes=user.confidential_notes,
        status="ACTIVE"  # ✅ FIXED: Use string directly instead of UserStatus.ACTIVE.value
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


def update_user(db: Session, user_id: str, user_update: UserUpdate) -> Optional[User]:
    """Update user"""
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    
    update_data = user_update.model_dump(exclude_unset=True)
    
    if "password" in update_data and update_data["password"]:
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    
    if "parent_id" in update_data:
        del update_data["parent_id"]
    
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: str) -> bool:
    """Delete user"""
    db_user = get_user(db, user_id)
    if not db_user:
        return False
    
    db.delete(db_user)
    db.commit()
    return True


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate user with password"""
    user = get_user_by_username(db, username)
    if not user:
        return None
    
    if not verify_password(password, user.hashed_password):
        return None
    
    return user


def get_team_profiles(db: Session, company_id: int, current_user_role: str) -> List[User]:
    """Get team profiles for Team Pulse Bar"""
    query = db.query(User).filter(
        User.company_id == company_id,
        User.is_active == True
    )
    return query.all()


def set_user_online(db: Session, user_id: str) -> Optional[User]:
    """Set user status to ACTIVE"""
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    db_user.status = "ACTIVE"  # ✅ FIXED: Use string directly
    db.commit()
    db.refresh(db_user)
    return db_user


def set_user_offline(db: Session, user_id: str) -> Optional[User]:
    """Set user status to OFFLINE"""
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    db_user.status = "OFFLINE"  # ✅ FIXED: Use string directly
    db.commit()
    db.refresh(db_user)
    return db_user


def set_user_busy(db: Session, user_id: str) -> Optional[User]:
    """Set user status to BUSY"""
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    db_user.status = "BUSY"  # ✅ FIXED: Use string directly
    db.commit()
    db.refresh(db_user)
    return db_user


def set_user_on_leave(db: Session, user_id: str) -> Optional[User]:
    """Set user status to ON_LEAVE"""
    db_user = get_user(db, user_id)
    if not db_user:
        return None
    db_user.status = "ON_LEAVE"  # ✅ FIXED: Use string directly
    db.commit()
    db.refresh(db_user)
    return db_user


def reset_company_sequences(db: Session, company_id: int) -> bool:
    """Reset all ID sequences for a company"""
    try:
        from app.models.id_sequence import IDSequence
        db.query(IDSequence).filter(IDSequence.company_id == company_id).delete()
        db.commit()
        return True
    except Exception:
        db.rollback()
        return False


def get_company_sequences(db: Session, company_id: int) -> List:
    """Get all ID sequences for a company"""
    from app.models.id_sequence import IDSequence
    return db.query(IDSequence).filter(IDSequence.company_id == company_id).all()