"""
Task Comment Model
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class TaskComment(Base):
    """Task comment model"""
    
    __tablename__ = "task_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    
    content = Column(Text, nullable=False)
    attachment_url = Column(String(500), nullable=True)
    attachment_filename = Column(String(255), nullable=True)
    is_edited = Column(Boolean, default=False)
    edited_at = Column(DateTime(timezone=True), nullable=True)
    
    # Threading
    parent_id = Column(Integer, ForeignKey("task_comments.id"), nullable=True, index=True)
    
    # Associations
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    task = relationship("Task", back_populates="comments")
    user = relationship("User")
    parent = relationship("TaskComment", remote_side=[id], backref="replies")
    
    def __repr__(self):
        return f"<TaskComment(id={self.id}, task_id={self.task_id})>"