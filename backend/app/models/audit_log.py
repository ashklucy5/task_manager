from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
from enum import Enum


class AuditAction(str, Enum):
    """Audit action enumeration"""
    LOGIN = "login"
    LOGOUT = "logout"
    TASK_CREATED = "task_created"
    TASK_UPDATED = "task_updated"
    TASK_COMPLETED = "task_completed"
    TASK_DELETED = "task_deleted"
    PAYMENT_VIEWED = "payment_viewed"
    PAYMENT_EDITED = "payment_edited"
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"


class AuditLog(Base):
    """Audit log model for tracking sensitive actions"""
    
    __tablename__ = "audit_logs"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Action Details
    action = Column(SQLEnum(AuditAction), nullable=False)
    entity_type = Column(String(50), nullable=True)  # e.g., "task", "user"
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)  # JSON string with additional details
    
    # User who performed the action
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", backref="audit_logs")
    
    # IP Address (for security)
    ip_address = Column(String(45), nullable=True)
    
    # Timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action}, user_id={self.user_id})>"