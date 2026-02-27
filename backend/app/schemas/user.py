from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    EMPLOYEE = "employee"


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"


# ==================== REQUEST SCHEMAS ====================

class UserCreate(BaseModel):
    """Schema for creating a new user"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.EMPLOYEE
    salary: Optional[int] = None  # Owner-only field (stored but hidden from non-owners)
    payment_rate: Optional[int] = None  # Owner-only field
    confidential_notes: Optional[str] = None  # Owner-only field

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "sarah.kim@acme.com",
                "username": "sarah_kim",
                "full_name": "Sarah Kim",
                "password": "SecurePass123!",
                "role": "employee",
                "salary": 520000,  # $5,200/month in cents
                "payment_rate": 22000  # $220/task
            }
        }
    }


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=100)
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    salary: Optional[int] = None  # Owner-only
    payment_rate: Optional[int] = None  # Owner-only
    confidential_notes: Optional[str] = None  # Owner-only

    model_config = {
        "json_schema_extra": {
            "example": {
                "full_name": "Sarah Kim",
                "status": "active",
                "salary": 550000
            }
        }
    }


class UserLogin(BaseModel):
    """Schema for user login"""
    username: str
    password: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "username": "alex_chen",
                "password": "MySecret123!"
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
                "id": 2,
                "email": "sarah.kim@acme.com",
                "username": "sarah_kim",
                "full_name": "Sarah Kim",
                "role": "employee",
                "status": "active",
                "is_active": True,
                "is_verified": True,
                "created_at": "2026-02-27T10:30:00Z"
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
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 2,
                "email": "sarah.kim@acme.com",
                "username": "sarah_kim",
                "full_name": "Sarah Kim",
                "role": "employee",
                "status": "active",
                "salary": 520000,
                "payment_rate": 22000,
                "confidential_notes": "Excellent designer, prefers Figma over Sketch",
                "is_active": True,
                "is_verified": True,
                "created_at": "2026-02-27T10:30:00Z",
                "updated_at": "2026-02-27T14:15:00Z"
            }
        }
    }


class UserProfile(BaseModel):
    """Schema for user profile (shown in Team Pulse Bar)"""
    id: int
    username: str
    full_name: str
    role: UserRole
    status: UserStatus
    capacity: Optional[int] = None  # % of weekly capacity used (calculated in service)

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 2,
                "username": "sarah_kim",
                "full_name": "Sarah Kim",
                "role": "employee",
                "status": "active",
                "capacity": 75
            }
        }
    }