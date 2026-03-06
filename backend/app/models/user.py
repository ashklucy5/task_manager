from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum, Text
from sqlalchemy.sql import func
from app.database import Base
from enum import Enum


class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"        # ✅ Online/Active
    OFFLINE = "OFFLINE"      # ✅ Default/Offline
    BUSY = "BUSY"            # ✅ Manual trigger from profile
    ON_LEAVE = "ON_LEAVE"    # ✅ Manual trigger from profile


class User(Base):
    """User model for authentication and authorization"""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    
    # ✅ Free-text role (no hierarchy)
    role = Column(String(100), nullable=False, default="member")
    
    # ✅ Simplified status enum
    status = Column(SQLEnum(UserStatus), nullable=False, default=UserStatus.OFFLINE)
    
    salary = Column(Integer, nullable=True)
    payment_rate = Column(Integer, nullable=True)
    
    # ✅ Profile image fields
    avatar_url = Column(String(500), nullable=True)
    avatar_filename = Column(String(255), nullable=True)
    
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    confidential_notes = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, role={self.role})>"