from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from enum import Enum


class AuditAction(str, Enum):
    """Audit action enumeration"""
    # Authentication
    LOGIN = "login"
    LOGOUT = "logout"
    
    # User Management
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    USER_ROLE_CHANGED = "user_role_changed"  # ✅ NEW: Critical for free-text roles
    USER_STATUS_UPDATED = "user_status_updated"  # ✅ NEW: Active/Offline/Busy
    USER_AVATAR_UPLOADED = "user_avatar_uploaded"  # ✅ NEW
    USER_AVATAR_DELETED = "user_avatar_deleted"  # ✅ NEW
    
    # Task Management
    TASK_CREATED = "task_created"
    TASK_UPDATED = "task_updated"
    TASK_COMPLETED = "task_completed"
    TASK_DELETED = "task_deleted"
    TASK_REQUIREMENTS_UPDATED = "task_requirements_updated"  # ✅ NEW: Critical for scope creep
    TASK_IMAGE_UPLOADED = "task_image_uploaded"  # ✅ NEW
    TASK_CLIENT_DETAILS_UPDATED = "task_client_details_updated"  # ✅ NEW
    
    # Financials
    PAYMENT_VIEWED = "payment_viewed"
    PAYMENT_EDITED = "payment_edited"
    PAYMENT_CREATED = "payment_created"  # ✅ NEW
    
    # Comments
    COMMENT_CREATED = "comment_created"  # ✅ NEW
    COMMENT_EDITED = "comment_edited"  # ✅ NEW
    COMMENT_DELETED = "comment_deleted"  # ✅ NEW


class AuditLog(Base):
    """Audit log model for tracking sensitive actions"""
    
    __tablename__ = "audit_logs"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Action Details
    action = Column(SQLEnum(AuditAction), nullable=False)
    entity_type = Column(String(50), nullable=True)  # e.g., "task", "user"
    entity_id = Column(Integer, nullable=True)
    
    # ✅ UPDATED: Details should store JSON string for change tracking
    # Example: {"old_role": "member", "new_role": "admin"} or {"field": "requirements", "changed_by": "user_id"}
    details = Column(Text, nullable=True)  
    
    # User who performed the action
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", backref="audit_logs")
    
    # IP Address (for security)
    ip_address = Column(String(45), nullable=True)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action}, user_id={self.user_id})>"