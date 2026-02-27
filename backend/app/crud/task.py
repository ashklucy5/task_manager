from sqlalchemy.orm import Session
from app.models.task import Task, TaskStatus, TaskPriority, TaskCategory
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate
from typing import Optional, List
from datetime import datetime


def get_task(db: Session, task_id: int) -> Optional[Task]:
    """Get task by ID"""
    return db.query(Task).filter(Task.id == task_id).first()


def get_tasks(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    assignee_id: Optional[int] = None,
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None
) -> List[Task]:
    """Get tasks with filters"""
    query = db.query(Task)
    
    if assignee_id:
        query = query.filter(Task.assignee_id == assignee_id)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    
    return query.offset(skip).limit(limit).all()


def get_user_tasks(db: Session, user_id: int) -> List[Task]:
    """Get all tasks assigned to a user"""
    return db.query(Task).filter(Task.assignee_id == user_id).all()


def create_task(db: Session, task: TaskCreate, assigned_by_id: int) -> Task:
    """Create a new task"""
    db_task = Task(
        title=task.title,
        description=task.description,
        category=task.category,
        priority=task.priority,
        assignee_id=task.assignee_id,
        assigned_by_id=assigned_by_id,
        due_date=task.due_date,
        payment_amount=task.payment_amount
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


def update_task(db: Session, task_id: int, task_update: TaskUpdate) -> Optional[Task]:
    """Update task information"""
    db_task = get_task(db, task_id)
    if not db_task:
        return None
    
    update_data = task_update.model_dump(exclude_unset=True)
    
    # Update fields
    for field, value in update_data.items():
        setattr(db_task, field, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task


def update_task_status(db: Session, task_id: int, status: TaskStatus) -> Optional[Task]:
    """Update task status only"""
    db_task = get_task(db, task_id)
    if not db_task:
        return None
    
    db_task.status = status
    
    # Auto-set completed_at if status is completed
    if status == TaskStatus.COMPLETED and not db_task.completed_at:
        db_task.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_task)
    return db_task


def delete_task(db: Session, task_id: int) -> bool:
    """Delete a task"""
    db_task = get_task(db, task_id)
    if not db_task:
        return False
    
    db.delete(db_task)
    db.commit()
    return True


def get_overdue_tasks(db: Session) -> List[Task]:
    """Get all overdue tasks"""
    return db.query(Task).filter(
        Task.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS]),
        Task.due_date < datetime.utcnow()
    ).all()


def get_tasks_with_assignee_name(db: Session, include_financials: bool = False):
    """
    Get tasks with assignee name joined.
    If include_financials is False, payment_amount will be None.
    """
    from sqlalchemy import select
    
    query = db.query(
        Task,
        User.full_name.label('assignee_name')
    ).join(User, Task.assignee_id == User.id)
    
    results = query.all()
    
    # Process results
    tasks = []
    for task, assignee_name in results:
        task_dict = task.__dict__.copy()
        task_dict['assignee_name'] = assignee_name
        
        # Strip financial data if not authorized
        if not include_financials:
            task_dict['payment_amount'] = None
            task_dict['is_paid'] = False
        
        tasks.append(task_dict)
    
    return tasks