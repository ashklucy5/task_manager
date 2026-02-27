from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum, Text
from sqlalchemy.sql import func
from app.database import Base
from enum import Enum
import uuid


class UserRole(str, Enum):
    """User role enumeration"""
    OWNER = "owner"
    ADMIN = "admin"
    EMPLOYEE = "employee"


class UserStatus(str, Enum):
    """User status enumeration"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"


class User(Base):
    """User model for authentication and authorization"""
    
    __tablename__ = "users"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Authentication Fields
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    # Profile Fields
    full_name = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.EMPLOYEE)
    status = Column(SQLEnum(UserStatus), nullable=False, default=UserStatus.ACTIVE)
    
    # Financial Data (Owner-only visibility)
    salary = Column(Integer, nullable=True)  # Monthly salary in cents
    payment_rate = Column(Integer, nullable=True)  # Per task rate in cents
    
    # Metadata
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Owner-only confidential notes
    confidential_notes = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, role={self.role})>"