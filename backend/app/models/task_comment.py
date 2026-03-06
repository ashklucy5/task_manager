from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, String, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class TaskComment(Base):
    """Task comment model for collaboration"""
    
    __tablename__ = "task_comments"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True)
    
    # Comment Content
    content = Column(Text, nullable=False)
    
    # ✅ NEW: Attachment/Image (Optional)
    attachment_url = Column(String(500), nullable=True)
    attachment_filename = Column(String(255), nullable=True)
    
    # ✅ NEW: Edit Tracking
    is_edited = Column(Boolean, default=False)
    edited_at = Column(DateTime(timezone=True), nullable=True)
    
    # ✅ NEW: Threading (Reply to another comment)
    parent_id = Column(Integer, ForeignKey("task_comments.id"), nullable=True)
    parent = relationship("TaskComment", remote_side=[id], backref="replies")
    
    # Relationships
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)
    task = relationship("Task", backref="comments")
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", backref="comments")
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<TaskComment(id={self.id}, task_id={self.task_id}, user_id={self.user_id})>"