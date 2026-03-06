from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum as SQLEnum, Numeric, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from enum import Enum


class TaskStatus(str, Enum):
    """Task status enumeration"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    """Task priority enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


# ✅ REMOVED: TaskCategory enum (now free-text string)


class Task(Base):
    """Task model for task management"""
    
    __tablename__ = "tasks"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Task Information
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # ✅ CHANGED: category is now free-text string (any value allowed)
    category = Column(String(100), nullable=False, default="general")
    
    priority = Column(SQLEnum(TaskPriority), nullable=False, default=TaskPriority.MEDIUM)
    status = Column(SQLEnum(TaskStatus), nullable=False, default=TaskStatus.PENDING)
    
    # Assignment
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assignee = relationship("User", foreign_keys=[assignee_id], backref="assigned_tasks")
    
    assigned_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])
    
    # ✅ NEW: Requirements Tracking
    requirements = Column(Text, nullable=True)  # Detailed requirements/instructions
    requirements_checklist = Column(JSON, nullable=True)  # [{"item": "...", "completed": true/false}]
    requirements_completed_at = Column(DateTime(timezone=True), nullable=True)  # When all requirements were met
    
    # ✅ NEW: Order/Client Details (Optional)
    client_name = Column(String(255), nullable=True)  # Person who ordered
    company_name = Column(String(255), nullable=True)  # Company who ordered
    
    # ✅ NEW: Product/Task Image (Optional)
    image_url = Column(String(500), nullable=True)
    image_filename = Column(String(255), nullable=True)
    
    # Financial Data (Owner-only visibility)
    payment_amount = Column(Integer, nullable=True)  # Task payment in cents
    is_paid = Column(Boolean, default=False)
    
    # Timeline
    due_date = Column(DateTime(timezone=True), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # AI Fields
    estimated_hours = Column(Numeric(5, 2), nullable=True)
    ai_priority_score = Column(Numeric(5, 2), nullable=True)
    
    def __repr__(self):
        return f"<Task(id={self.id}, title={self.title}, status={self.status})>"