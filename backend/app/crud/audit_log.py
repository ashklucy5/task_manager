from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog, AuditAction
from typing import Optional, List
from datetime import datetime
import json


def create_audit_log(
    db: Session,
    user_id: int,
    action: AuditAction,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    details: Optional[dict] = None,  # ✅ Changed to dict (will be JSON encoded)
    ip_address: Optional[str] = None
) -> AuditLog:
    """Create a new audit log entry"""
    # Convert details dict to JSON string
    details_json = json.dumps(details) if details else None
    
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details_json,
        ip_address=ip_address
    )
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log


def get_user_audit_logs(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[AuditLog]:
    """Get audit logs for a specific user"""
    return db.query(AuditLog).filter(AuditLog.user_id == user_id).offset(skip).limit(limit).all()


def get_audit_logs_by_action(db: Session, action: AuditAction, skip: int = 0, limit: int = 100) -> List[AuditLog]:
    """Get audit logs by action type"""
    return db.query(AuditLog).filter(AuditLog.action == action).offset(skip).limit(limit).all()


def get_entity_audit_logs(db: Session, entity_type: str, entity_id: int, skip: int = 0, limit: int = 100) -> List[AuditLog]:
    """Get audit logs for a specific entity (task, user, etc.)"""
    return db.query(AuditLog).filter(
        AuditLog.entity_type == entity_type,
        AuditLog.entity_id == entity_id
    ).offset(skip).limit(limit).all()


# ✅ Helper Functions for Common Actions

def log_user_action(db: Session, user_id: int, action: AuditAction, ip_address: Optional[str] = None):
    """Log user authentication actions"""
    return create_audit_log(
        db=db,
        user_id=user_id,
        action=action,
        entity_type="user",
        entity_id=user_id,
        ip_address=ip_address
    )


def log_task_action(db: Session, user_id: int, action: AuditAction, task_id: int, details: Optional[dict] = None):
    """Log task-related actions"""
    return create_audit_log(
        db=db,
        user_id=user_id,
        action=action,
        entity_type="task",
        entity_id=task_id,
        details=details
    )


def log_role_change(db: Session, user_id: int, actor_id: int, old_role: str, new_role: str):
    """Log role change (for audit trail)"""
    return create_audit_log(
        db=db,
        user_id=actor_id,
        action=AuditAction.USER_ROLE_CHANGED,
        entity_type="user",
        entity_id=user_id,
        details={"old_role": old_role, "new_role": new_role}
    )


def log_requirements_update(db: Session, user_id: int, task_id: int, changes: dict):
    """Log requirements update"""
    return create_audit_log(
        db=db,
        user_id=user_id,
        action=AuditAction.TASK_REQUIREMENTS_UPDATED,
        entity_type="task",
        entity_id=task_id,
        details=changes
    )