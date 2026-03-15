"""
Authentication Endpoints
Login uses username (which equals email)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserLogin, Token, UserCreate
from app.crud.user import authenticate_user, create_user, set_user_online, set_user_offline
from app.core.security import create_access_token
from app.core.config import settings
from app.models.user import User
from app.api.deps import get_current_user
from datetime import timedelta

router = APIRouter(tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(
    form_data: UserLogin,
    db: Session = Depends(get_db),
    request: Request = None
):
    """Login with username or email + password"""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    set_user_online(db, user.id)
    
    company_code = user.company.company_code
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.username,
            "user_id": user.id,
            "company_id": user.company_id,
            "company_code": company_code,
            "role": user.role,
        },
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout user"""
    set_user_offline(db, current_user.id)
    return {"message": "Successfully logged out", "status": "offline"}


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    user: UserCreate,
    db: Session = Depends(get_db),
    request: Request = None
):
    """Register a new user"""
    existing_user = db.query(User).filter(
        (User.email == user.email) | (User.username == user.username)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    db_user = create_user(db, user)
    set_user_online(db, db_user.id)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": db_user.username,
            "role": db_user.role,
            "user_id": db_user.id,
            "company_id": db_user.company_id,
            "company_code": db_user.company.company_code,
        },
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user info"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "status": current_user.status,
        "company_id": current_user.company_id,
        "position": current_user.position,
        "avatar_url": current_user.avatar_url
    }