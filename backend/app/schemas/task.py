"""
Task Pydantic Schemas
assignee_id uses string (hierarchical ID) to match database
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ==================== ENUMS (Pydantic-compatible) ====================

class TaskStatus(str, Enum):
    """Task status enumeration - lowercase values"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    """Task priority enumeration - lowercase values"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


# ==================== REQUEST SCHEMAS ====================

class TaskCreate(BaseModel):
    """Schema for creating a new task"""
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    
    # Requirements
    requirements: Optional[str] = Field(None, max_length=5000)
    requirements_checklist: Optional[List[dict]] = None
    
    # Client Info
    client_name: Optional[str] = Field(None, max_length=255)
    company_name: Optional[str] = Field(None, max_length=255)
    
    # Category (free text)
    category: str = Field(default="general", min_length=1, max_length=100)
    
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.PENDING
    
    # ✅ FIX: assignee_id is STRING (hierarchical ID), NOT int
    assignee_id: str
    
    due_date: datetime
    
    # Financial (Owner-only)
    payment_amount: Optional[int] = None

    @field_validator('requirements_checklist')
    @classmethod
    def validate_checklist(cls, v: Optional[List[dict]]) -> Optional[List[dict]]:
        if v is None:
            return v
        for item in v:
            if not isinstance(item, dict) or 'item' not in item or 'completed' not in item:
                raise ValueError('Each checklist item must have "item" (str) and "completed" (bool)')
        return v
    
    @field_validator('category')
    @classmethod
    def normalize_category(cls, v: str) -> str:
        return v.strip().lower()


class TaskUpdate(BaseModel):
    """Schema for updating a task"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    
    # Requirements
    requirements: Optional[str] = Field(None, max_length=5000)
    requirements_checklist: Optional[List[dict]] = None
    
    # Client Info
    client_name: Optional[str] = Field(None, max_length=255)
    company_name: Optional[str] = Field(None, max_length=255)
    
    # Category
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[datetime] = None
    
    # Financial (Owner-only)
    payment_amount: Optional[int] = None
    is_paid: Optional[bool] = None

    @field_validator('requirements_checklist')
    @classmethod
    def validate_checklist(cls, v: Optional[List[dict]]) -> Optional[List[dict]]:
        if v is None:
            return v
        for item in v:
            if not isinstance(item, dict) or 'item' not in item or 'completed' not in item:
                raise ValueError('Each checklist item must have "item" and "completed"')
        return v
    
    @field_validator('category')
    @classmethod
    def normalize_category(cls, v: Optional[str]) -> Optional[str]:
        return v.strip().lower() if v else v


class TaskStatusUpdate(BaseModel):
    """Schema for updating task status only"""
    status: TaskStatus


# ==================== RESPONSE SCHEMAS ====================

class TaskResponse(BaseModel):
    """Schema for task response (without financial data)"""
    id: int
    title: str
    description: Optional[str] = None
    
    # Requirements
    requirements: Optional[str] = None
    requirements_checklist: Optional[List[dict]] = None
    requirements_completed_at: Optional[datetime] = None
    
    # Client Info
    client_name: Optional[str] = None
    company_name: Optional[str] = None
    
    # Image
    image_url: Optional[str] = None
    image_filename: Optional[str] = None
    
    # Category (free text)
    category: str
    
    priority: TaskPriority
    status: TaskStatus
    
    # ✅ FIX: assignee_id is STRING (hierarchical ID)
    assignee_id: str
    assignee_name: Optional[str] = None
    
    due_date: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    created_at: datetime
    updated_at: datetime
    
    # AI Fields
    estimated_hours: Optional[float] = None
    ai_priority_score: Optional[float] = None
    
    model_config = {"from_attributes": True}


class TaskWithFinancials(BaseModel):
    """Schema for task response WITH financial data (Owner-only)"""
    id: int
    title: str
    description: Optional[str] = None
    
    # Requirements
    requirements: Optional[str] = None
    requirements_checklist: Optional[List[dict]] = None
    requirements_completed_at: Optional[datetime] = None
    
    # Client Info
    client_name: Optional[str] = None
    company_name: Optional[str] = None
    
    # Image
    image_url: Optional[str] = None
    image_filename: Optional[str] = None
    
    # Category
    category: str
    
    priority: TaskPriority
    status: TaskStatus
    
    # ✅ FIX: assignee_id is STRING
    assignee_id: str
    assignee_name: Optional[str] = None
    
    # Financial Fields (Owner-only)
    payment_amount: Optional[int] = None
    is_paid: bool = False
    
    due_date: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    created_at: datetime
    updated_at: datetime
    
    # AI Fields
    estimated_hours: Optional[float] = None
    ai_priority_score: Optional[float] = None
    
    model_config = {"from_attributes": True}


# ==================== COMMENT SCHEMAS ====================

class TaskCommentCreate(BaseModel):
    """Schema for creating a task comment"""
    content: str = Field(..., min_length=1, max_length=5000)
    
    # Optional attachment
    attachment_url: Optional[str] = None
    attachment_filename: Optional[str] = None
    
    # Threading (reply to another comment)
    parent_id: Optional[int] = None


class TaskCommentUpdate(BaseModel):
    """Schema for updating a comment"""
    content: Optional[str] = Field(None, min_length=1, max_length=5000)


class TaskCommentResponse(BaseModel):
    """Schema for task comment response"""
    id: int
    content: str
    
    # Attachment info
    attachment_url: Optional[str] = None
    attachment_filename: Optional[str] = None
    
    # Edit tracking
    is_edited: bool = False
    edited_at: Optional[datetime] = None
    
    # Threading
    parent_id: Optional[int] = None
    
    user_id: str
    username: str
    task_id: int
    
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}