"""
Task Model
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Task(Base):
    """Task model for task management"""
    
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False)
    priority = Column(String(50), nullable=False, default="MEDIUM")
    status = Column(String(50), nullable=False, default="PENDING")
    
    # Assignee (hierarchical ID - string)
    assignee_id = Column(String(50), ForeignKey("users.id"), nullable=False, index=True)
    assigned_by_id = Column(String(50), ForeignKey("users.id"), nullable=True, index=True)
    
    # Requirements
    requirements = Column(Text, nullable=True)
    requirements_checklist = Column(Text, nullable=True)
    requirements_completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Client info
    client_name = Column(String(255), nullable=True)
    company_name = Column(String(255), nullable=True)
    
    # Image
    image_url = Column(String(500), nullable=True)
    image_filename = Column(String(255), nullable=True)
    image_cloudinary_public_id = Column(String(255), nullable=True)
    image_cloudinary_url = Column(String(500), nullable=True)
    
    # Financial
    payment_amount = Column(Integer, nullable=True)
    is_paid = Column(Boolean, default=False)
    
    # Dates
    due_date = Column(DateTime(timezone=True), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # AI fields
    estimated_hours = Column(Numeric(5, 2), nullable=True)
    ai_priority_score = Column(Numeric(5, 2), nullable=True)
    
    # Relationships
    assignee = relationship("User", foreign_keys=[assignee_id], back_populates="tasks_assigned")
    assigned_by = relationship("User", foreign_keys=[assigned_by_id], back_populates="tasks_created")
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Task(id={self.id}, title={self.title}, status={self.status})>"