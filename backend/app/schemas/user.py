from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
from enum import Enum  # ✅ Standard Python enum


# ==================== ENUMS (Must be str + Enum for Pydantic v2) ====================

class UserStatus(str, Enum):
    """User status enumeration - MUST inherit from str, Enum"""
    ACTIVE = "ACTIVE"
    OFFLINE = "OFFLINE"
    BUSY = "BUSY"
    ON_LEAVE = "ON_LEAVE"


# ==================== REQUEST SCHEMAS ====================

class UserCreate(BaseModel):
    """Schema for creating a new user"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8, max_length=72)
    
    # ✅ Role is now free-text string (no enum)
    role: str = Field(default="member", min_length=1, max_length=100)
    
    salary: Optional[int] = None
    payment_rate: Optional[int] = None
    confidential_notes: Optional[str] = None

    @field_validator('password')
    @classmethod
    def validate_password_bytes(cls, v: str) -> str:
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password cannot exceed 72 bytes (UTF-8 encoded)')
        return v
    
    @field_validator('role')
    @classmethod
    def normalize_role(cls, v: str) -> str:
        return v.strip().lower()

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "owner@nexusflow.com",
                "username": "owner",
                "full_name": "Business Owner",
                "password": "SecurePass123!",
                "role": "owner",
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
    
    # ✅ Role is optional string
    role: Optional[str] = Field(None, min_length=1, max_length=100)
    
    # ✅ Status uses the properly defined UserStatus enum
    status: Optional[UserStatus] = None
    
    salary: Optional[int] = None
    payment_rate: Optional[int] = None
    confidential_notes: Optional[str] = None

    @field_validator('password')
    @classmethod
    def validate_password_bytes(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v.encode('utf-8')) > 72:
            raise ValueError('Password cannot exceed 72 bytes')
        return v
    
    @field_validator('role')
    @classmethod
    def normalize_role(cls, v: Optional[str]) -> Optional[str]:
        return v.strip().lower() if v else v

    model_config = {
        "json_schema_extra": {
            "example": {
                "full_name": "Sarah Kim",
                "status": "ACTIVE",
                "salary": 550000
            }
        }
    }


class UserLogin(BaseModel):
    """Schema for user login"""
    username: str
    password: str = Field(..., max_length=72)

    @field_validator('password')
    @classmethod
    def validate_password_bytes(cls, v: str) -> str:
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password cannot exceed 72 bytes')
        return v

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
    role: Optional[str] = None  # ✅ String, not enum


# ==================== RESPONSE SCHEMAS ====================

class UserResponse(BaseModel):
    """Schema for user response (without sensitive financial data)"""
    id: int
    email: EmailStr
    username: str
    full_name: str
    
    # ✅ Role is string
    role: str
    
    # ✅ Status uses UserStatus enum
    status: UserStatus
    
    # ✅ Avatar fields
    avatar_url: Optional[str] = None
    
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
                "role": "owner",
                "status": "ACTIVE",
                "avatar_url": "/static/avatars/1_abc123.png",
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
    role: str  # ✅ String
    status: UserStatus  # ✅ Enum
    avatar_url: Optional[str] = None
    salary: Optional[int] = None
    payment_rate: Optional[int] = None
    confidential_notes: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class UserProfile(BaseModel):
    """Schema for user profile (shown in Team Pulse Bar)"""
    id: int
    username: str
    full_name: str
    role: str  # ✅ String
    status: UserStatus  # ✅ Enum
    avatar_url: Optional[str] = None
    capacity: Optional[int] = None

    model_config = {"from_attributes": True}