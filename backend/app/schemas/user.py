"""
User Pydantic Schemas
Username auto-set to email if not provided
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class UserStatus(str, Enum):
    """User status enumeration"""
    ACTIVE = "ACTIVE"
    OFFLINE = "OFFLINE"
    BUSY = "BUSY"
    ON_LEAVE = "ON_LEAVE"


class UserCreate(BaseModel):
    """Schema for creating a new user"""
    email: EmailStr
    username: Optional[str] = Field(None, max_length=100)  # ✅ Optional - auto-filled from email
    full_name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8)
    position: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., pattern="^(super_admin|admin|member)$")
    company_id: int
    parent_id: Optional[str] = None
    salary: Optional[int] = None
    payment_rate: Optional[int] = None
    confidential_notes: Optional[str] = None

    @field_validator('username')
    @classmethod
    def auto_username(cls, v, info):
        """Auto-set username to email if not provided"""
        if v is None and 'email' in info.data:
            return info.data['email']
        return v

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets minimum requirements"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "superadmin1@techcorp.com",
                "username": None,
                "full_name": "Alice Johnson - CEO",
                "password": "SecurePass123!",
                "role": "super_admin",
                "company_id": 1,
                "parent_id": None,
                "position": "CEO"
            }
        }
    }


class UserUpdate(BaseModel):
    """Schema for updating user information - ALL fields optional"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, max_length=100)
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    password: Optional[str] = Field(None, min_length=8)
    role: Optional[str] = Field(None, pattern="^(super_admin|admin|member)$")  # ✅ Optional
    status: Optional[UserStatus] = None
    parent_id: Optional[str] = None
    position: Optional[str] = Field(None, min_length=1, max_length=100)
    salary: Optional[int] = None
    payment_rate: Optional[int] = None
    confidential_notes: Optional[str] = None
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: Optional[str]) -> Optional[str]:
        if v:
            if len(v) < 8:
                raise ValueError('Password must be at least 8 characters')
            if not any(c.isupper() for c in v):
                raise ValueError('Password must contain at least one uppercase letter')
            if not any(c.islower() for c in v):
                raise ValueError('Password must contain at least one lowercase letter')
            if not any(c.isdigit() for c in v):
                raise ValueError('Password must contain at least one number')
        return v

class UserLogin(BaseModel):
    """Schema for user login (username or email)"""
    username: str = Field(..., description="Username or email")
    password: str = Field(..., min_length=8)

    model_config = {
        "json_schema_extra": {
            "example": {
                "username": "superadmin1@techcorp.com",
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
    user_id: Optional[str] = None
    company_id: Optional[int] = None
    company_code: Optional[str] = None


class UserResponse(BaseModel):
    """Schema for user response (without financial data)"""
    id: str
    email: EmailStr
    username: str
    full_name: str
    role: str
    company_id: int
    company_code: Optional[str] = None
    company_name: Optional[str] = None
    parent_id: Optional[str] = None
    position: Optional[str] = None
    status: UserStatus
    avatar_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    model_config = {"from_attributes": True}


class UserWithFinancials(BaseModel):
    """Schema for user response WITH financial data"""
    id: str
    email: EmailStr
    username: str
    full_name: str
    role: str
    company_id: int
    parent_id: Optional[str] = None
    position: Optional[str] = None
    status: UserStatus
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
    """Schema for user profile (Team Pulse Bar)"""
    id: str
    username: str
    full_name: str
    role: str
    company_id: int
    position: Optional[str] = None
    status: UserStatus
    avatar_url: Optional[str] = None
    capacity: Optional[int] = None
    is_online: bool = False
    last_seen: Optional[datetime] = None
    salary: Optional[int] = None
    payment_rate: Optional[int] = None
    
    model_config = {"from_attributes": True}