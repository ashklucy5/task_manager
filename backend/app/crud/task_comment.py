from sqlalchemy.orm import Session
from app.models.task_comment import TaskComment
from app.schemas.task import TaskCommentCreate
from typing import Optional, List


def get_comment(db: Session, comment_id: int) -> Optional[TaskComment]:
    """Get comment by ID"""
    return db.query(TaskComment).filter(TaskComment.id == comment_id).first()


def get_task_comments(db: Session, task_id: int) -> List[TaskComment]:
    """Get all comments for a task"""
    return db.query(TaskComment).filter(TaskComment.task_id == task_id).all()


def create_comment(db: Session, comment: TaskCommentCreate, task_id: int, user_id: int) -> TaskComment:
    """Create a new comment"""
    db_comment = TaskComment(
        content=comment.content,
        task_id=task_id,
        user_id=user_id
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment


def update_comment(db: Session, comment_id: int, content: str) -> Optional[TaskComment]:
    """Update comment content"""
    db_comment = get_comment(db, comment_id)
    if not db_comment:
        return None
    
    db_comment.content = content
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