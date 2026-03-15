"""
User Model
Hierarchical multi-company architecture with company-prefixed IDs
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    """User model with hierarchical ID structure"""
    
    __tablename__ = "users"
    
    # Hierarchical ID
    id = Column(String(50), primary_key=True)
    
    # Company association
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    
    # Parent user
    parent_id = Column(String(50), ForeignKey("users.id"), nullable=True, index=True)
    
    # User role
    role = Column(String(50), nullable=False, index=True)
    
    # Position/Title
    position = Column(String(100), nullable=True)
    
    # Authentication
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    
    # Profile
    full_name = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="ACTIVE")
    avatar_url = Column(String(500), nullable=True)
    avatar_cloudinary_public_id = Column(String(255), nullable=True)
    avatar_cloudinary_url = Column(String(500), nullable=True)
    avatar_qiniu_key = Column(String(255), nullable=True)
    avatar_qiniu_url = Column(String(500), nullable=True)
    avatar_storage_provider = Column(String(50), nullable=True)
    
    # Financial
    salary = Column(Integer, nullable=True)
    payment_rate = Column(Integer, nullable=True)
    confidential_notes = Column(Text, nullable=True)
    
    # Status flags
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="users")
    parent = relationship("User", remote_side=[id], backref="subordinates")
    tasks_assigned = relationship("Task", foreign_keys="Task.assignee_id", back_populates="assignee")
    tasks_created = relationship("Task", foreign_keys="Task.assigned_by_id", back_populates="assigned_by")
    
    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, role={self.role})>"