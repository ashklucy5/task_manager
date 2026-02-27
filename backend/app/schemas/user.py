from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    OWNER = "OWNER"      # ✅ UPPERCASE CONSISTENT
    ADMIN = "ADMIN"      # ✅ UPPERCASE CONSISTENT
    EMPLOYEE = "EMPLOYEE"  # ✅ UPPERCASE CONSISTENT


class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"      # ✅ UPPERCASE CONSISTENT
    INACTIVE = "INACTIVE"  # ✅ UPPERCASE CONSISTENT
    ON_LEAVE = "ON_LEAVE"  # ✅ UPPERCASE CONSISTENT


# ==================== REQUEST SCHEMAS ====================

class UserCreate(BaseModel):
    """Schema for creating a new user"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8, max_length=72)
    role: UserRole = UserRole.EMPLOYEE
    salary: Optional[int] = None
    payment_rate: Optional[int] = None
    confidential_notes: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "owner@nexusflow.com",
                "username": "owner",
                "full_name": "Business Owner",
                "password": "SecurePass123!",
                "role": "OWNER",  # ✅ UPPERCASE
                "salary": 1200000,
                "payment_rate": 50000
            }
        }
    }


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    password: Optional[str] = Field(None, min_length=8, max_length=72)
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    salary: Optional[int] = None
    payment_rate: Optional[int] = None
    confidential_notes: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "full_name": "Sarah Kim",
                "status": "ACTIVE",  # ✅ UPPERCASE
                "salary": 550000
            }
        }
    }


class UserLogin(BaseModel):
    """Schema for user login"""
    username: str
    password: str = Field(..., max_length=72)

    model_config = {
        "json_schema_extra": {
            "example": {
                "username": "owner",
                "password": "SecurePass123!"
            }
        }
    }


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Schema for token payload"""
    username: Optional[str] = None
    role: Optional[str] = None


# ==================== RESPONSE SCHEMAS ====================

class UserResponse(BaseModel):
    """Schema for user response (without sensitive financial data)"""
    id: int
    email: EmailStr
    username: str
    full_name: str
    role: UserRole
    status: UserStatus
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 1,
                "email": "owner@nexusflow.com",
                "username": "owner",
                "full_name": "Business Owner",
                "role": "OWNER",    # ✅ UPPERCASE
                "status": "ACTIVE", # ✅ UPPERCASE
                "is_active": True,
                "is_verified": False,
                "created_at": "2026-02-28T01:30:00Z"
            }
        }
    }


class UserWithFinancials(BaseModel):
    """Schema for user response WITH financial data (Owner-only)"""
    id: int
    email: EmailStr
    username: str
    full_name: str
    role: UserRole
    status: UserStatus
    salary: Optional[int] = None
    payment_rate: Optional[int] = None
    confidential_notes: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = {
        "from_attributes": True
    }


class UserProfile(BaseModel):
    """Schema for user profile (shown in Team Pulse Bar)"""
    id: int
    username: str
    full_name: str
    role: UserRole
    status: UserStatus
    capacity: Optional[int] = None

    model_config = {
        "from_attributes": True
    }