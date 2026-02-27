from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog, AuditAction
from typing import Optional, List
from datetime import datetime


def create_audit_log(
    db: Session,
    user_id: int,
    action: AuditAction,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    """Create a new audit log entry"""
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
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