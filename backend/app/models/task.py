from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum as SQLEnum, Numeric
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


class TaskCategory(str, Enum):
    """Task category enumeration"""
    DEVELOPMENT = "development"
    MARKETING = "marketing"
    SALES = "sales"
    HR = "hr"
    FINANCE = "finance"
    OPERATIONS = "operations"
    OTHER = "other"


class Task(Base):
    """Task model for task management"""
    
    __tablename__ = "tasks"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Task Information
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(SQLEnum(TaskCategory), nullable=False, default=TaskCategory.OTHER)
    priority = Column(SQLEnum(TaskPriority), nullable=False, default=TaskPriority.MEDIUM)
    status = Column(SQLEnum(TaskStatus), nullable=False, default=TaskStatus.PENDING)
    
    # Assignment
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assignee = relationship("User", foreign_keys=[assignee_id], backref="assigned_tasks")
    
    assigned_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])
    
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