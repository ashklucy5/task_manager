"""
Audit Log Model
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class AuditLog(Base):
    """Audit log for tracking user actions"""
    
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    action = Column(String(50), nullable=False)  # LOGIN, LOGOUT, USER_CREATED, etc.
    entity_type = Column(String(50), nullable=True)  # user, task, company
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    ip_address = Column(String(45), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action}, user_id={self.user_id})>"