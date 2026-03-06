from sqlalchemy.orm import Session
from app.models.task_comment import TaskComment
from app.schemas.task import TaskCommentCreate, TaskCommentUpdate  # ✅ FIXED IMPORT
from typing import Optional, List


def get_comment(db: Session, comment_id: int) -> Optional[TaskComment]:
    """Get comment by ID"""
    return db.query(TaskComment).filter(TaskComment.id == comment_id).first()


def get_task_comments(db: Session, task_id: int) -> List[TaskComment]:
    """Get all comments for a task"""
    return db.query(TaskComment).filter(TaskComment.task_id == task_id).all()


def get_comment_replies(db: Session, parent_id: int) -> List[TaskComment]:
    """Get all replies to a comment"""
    return db.query(TaskComment).filter(TaskComment.parent_id == parent_id).all()


def create_comment(
    db: Session, 
    content: str, 
    task_id: int, 
    user_id: int,
    parent_id: Optional[int] = None,
    attachment_url: Optional[str] = None,
    attachment_filename: Optional[str] = None
) -> TaskComment:
    """Create a new comment"""
    db_comment = TaskComment(
        content=content,
        task_id=task_id,
        user_id=user_id,
        parent_id=parent_id,
        attachment_url=attachment_url,
        attachment_filename=attachment_filename,
        is_edited=False,
        edited_at=None
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment


def update_comment(db: Session, comment_id: int, content: str) -> Optional[TaskComment]:
    """Update comment content with edit tracking"""
    db_comment = get_comment(db, comment_id)
    if not db_comment:
        return None
    
    db_comment.content = content
    db_comment.is_edited = True
    db_comment.edited_at = None  # Set via endpoint if needed
    db_comment.updated_at = None
    db.commit()
    db.refresh(db_comment)
    return db_comment


def update_comment_attachment(
    db: Session, 
    comment_id: int, 
    attachment_url: str, 
    attachment_filename: str
) -> Optional[TaskComment]:
    """Update comment attachment"""
    db_comment = get_comment(db, comment_id)
    if not db_comment:
        return None
    
    db_comment.attachment_url = attachment_url
    db_comment.attachment_filename = attachment_filename
    db.commit()
    db.refresh(db_comment)
    return db_comment


def delete_comment_attachment(db: Session, comment_id: int) -> Optional[TaskComment]:
    """Delete comment attachment"""
    db_comment = get_comment(db, comment_id)
    if not db_comment:
        return None
    
    db_comment.attachment_url = None
    db_comment.attachment_filename = None
    db.commit()
    db.refresh(db_comment)
    return db_comment


def delete_comment(db: Session, comment_id: int) -> bool:
    """Delete a comment"""
    db_comment = get_comment(db, comment_id)
    if not db_comment:
        return False
    
    db.delete(db_comment)
    db.commit()
    return True