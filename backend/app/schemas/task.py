from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum
from decimal import Decimal


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TaskCategory(str, Enum):
    DEVELOPMENT = "development"
    MARKETING = "marketing"
    SALES = "sales"
    HR = "hr"
    FINANCE = "finance"
    OPERATIONS = "operations"
    OTHER = "other"


# ==================== REQUEST SCHEMAS ====================

class TaskCreate(BaseModel):
    """Schema for creating a new task"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: TaskCategory = TaskCategory.OTHER
    priority: TaskPriority = TaskPriority.MEDIUM
    assignee_id: int
    due_date: datetime
    payment_amount: Optional[int] = None  # Owner-only field


class TaskUpdate(BaseModel):
    """Schema for updating a task"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[TaskCategory] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[datetime] = None
    payment_amount: Optional[int] = None  # Owner-only field
    is_paid: Optional[bool] = None  # Owner-only field


class TaskStatusUpdate(BaseModel):
    """Schema for updating task status only"""
    status: TaskStatus


# ==================== RESPONSE SCHEMAS ====================

class TaskResponse(BaseModel):
    """Schema for task response (without financial data)"""
    id: int
    title: str
    description: Optional[str] = None
    category: TaskCategory
    priority: TaskPriority
    status: TaskStatus
    assignee_id: int
    assignee_name: str
    due_date: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TaskWithFinancials(BaseModel):
    """Schema for task response WITH financial data (Owner-only)"""
    id: int
    title: str
    description: Optional[str] = None
    category: TaskCategory
    priority: TaskPriority
    status: TaskStatus
    assignee_id: int
    assignee_name: str
    due_date: datetime
    payment_amount: Optional[int] = None
    is_paid: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TaskCommentCreate(BaseModel):
    """Schema for creating a task comment"""
    content: str = Field(..., min_length=1)


class TaskCommentResponse(BaseModel):
    """Schema for task comment response"""
    id: int
    content: str
    user_id: int
    username: str
    created_at: datetime
    
    class Config:
        from_attributes = True