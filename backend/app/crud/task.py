"""
Task CRUD Operations
Uses string values for status/priority (not enums)
"""
from sqlalchemy.orm import Session
from app.models.task import Task
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
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None
) -> List[Task]:
    """Get tasks with filters"""
    query = db.query(Task)

    if assignee_id:
        query = query.filter(Task.assignee_id == assignee_id)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if category:
        query = query.filter(Task.category.ilike(f"%{category.lower()}%"))

    return query.offset(skip).limit(limit).all()


def get_user_tasks(db: Session, user_id: int) -> List[Task]:
    """Get all tasks assigned to a user"""
    return db.query(Task).filter(Task.assignee_id == user_id).all()


def create_task(db: Session, task: TaskCreate, assigned_by_id: int) -> Task:
    """Create a new task"""
    # Derive legacy image_url from first entry in image_urls if provided
    first_image_url = task.image_urls[0] if task.image_urls else None

    db_task = Task(
        title=task.title,
        description=task.description,
        category=task.category,
        priority=task.priority,
        status=task.status,
        assignee_id=task.assignee_id,
        assigned_by_id=assigned_by_id,
        due_date=task.due_date,
        payment_amount=task.payment_amount,
        requirements=task.requirements,
        requirements_checklist=task.requirements_checklist,
        client_name=task.client_name,
        company_name=task.company_name,
        # ✅ Both single (legacy) and multi-image fields populated
        image_url=first_image_url,
        image_filename=None,
        image_urls=task.image_urls,  # ✅ NEW: store full list
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

    for field, value in update_data.items():
        setattr(db_task, field, value)

    # Keep legacy image_url in sync with image_urls
    if "image_urls" in update_data:
        urls = update_data["image_urls"]
        db_task.image_url = urls[0] if urls else None

    db.commit()
    db.refresh(db_task)
    return db_task


def update_task_status(db: Session, task_id: int, status: str) -> Optional[Task]:
    """Update task status only"""
    db_task = get_task(db, task_id)
    if not db_task:
        return None

    db_task.status = status

    if status == "completed" and not db_task.completed_at:
        db_task.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(db_task)
    return db_task


# ==================== REQUIREMENTS FUNCTIONS ====================

def update_task_requirements(db: Session, task_id: int, requirements: str) -> Optional[Task]:
    """Update task requirements text"""
    db_task = get_task(db, task_id)
    if not db_task:
        return None

    db_task.requirements = requirements
    db.commit()
    db.refresh(db_task)
    return db_task


def update_task_checklist(db: Session, task_id: int, checklist: list) -> Optional[Task]:
    """Update task requirements checklist"""
    db_task = get_task(db, task_id)
    if not db_task:
        return None

    db_task.requirements_checklist = checklist

    if checklist and all(item.get("completed", False) for item in checklist):
        db_task.requirements_completed_at = datetime.utcnow()
    else:
        db_task.requirements_completed_at = None

    db.commit()
    db.refresh(db_task)
    return db_task


def get_checklist_completion(db: Session, task_id: int) -> dict:
    """Get checklist completion stats"""
    db_task = get_task(db, task_id)
    if not db_task or not db_task.requirements_checklist:
        return {"total": 0, "completed": 0, "percentage": 0}

    checklist = db_task.requirements_checklist
    total = len(checklist)
    completed = sum(1 for item in checklist if item.get("completed", False))
    percentage = (completed / total * 100) if total > 0 else 0

    return {"total": total, "completed": completed, "percentage": percentage}


# ==================== IMAGE FUNCTIONS ====================

def update_task_image(db: Session, task_id: int, image_url: str, image_filename: str) -> Optional[Task]:
    """Update legacy single task image and keep image_urls in sync"""
    db_task = get_task(db, task_id)
    if not db_task:
        return None

    db_task.image_url = image_url
    db_task.image_filename = image_filename

    # Keep image_urls list in sync
    existing = list(db_task.image_urls or [])
    if image_url not in existing:
        existing.insert(0, image_url)
        db_task.image_urls = existing[:6]  # enforce max

    db.commit()
    db.refresh(db_task)
    return db_task


def update_task_images(db: Session, task_id: int, image_urls: List[str]) -> Optional[Task]:
    """Replace the full image_urls list (max 6) and sync legacy image_url"""
    db_task = get_task(db, task_id)
    if not db_task:
        return None

    db_task.image_urls = image_urls[:6]
    db_task.image_url = image_urls[0] if image_urls else None

    db.commit()
    db.refresh(db_task)
    return db_task


def append_task_images(db: Session, task_id: int, new_urls: List[str]) -> Optional[Task]:
    """Append new URLs to the existing image_urls list (respects max 6)"""
    db_task = get_task(db, task_id)
    if not db_task:
        return None

    existing = list(db_task.image_urls or [])
    slots = 6 - len(existing)
    if slots > 0:
        existing.extend(new_urls[:slots])

    db_task.image_urls = existing
    db_task.image_url = existing[0] if existing else None

    db.commit()
    db.refresh(db_task)
    return db_task


def delete_task_image(db: Session, task_id: int) -> Optional[Task]:
    """Delete legacy single task image"""
    db_task = get_task(db, task_id)
    if not db_task:
        return None

    db_task.image_url = None
    db_task.image_filename = None
    db.commit()
    db.refresh(db_task)
    return db_task


# ==================== CLIENT INFO FUNCTIONS ====================

def update_task_client_info(
    db: Session,
    task_id: int,
    client_name: Optional[str] = None,
    company_name: Optional[str] = None
) -> Optional[Task]:
    """Update task client/company details"""
    db_task = get_task(db, task_id)
    if not db_task:
        return None

    if client_name is not None:
        db_task.client_name = client_name
    if company_name is not None:
        db_task.company_name = company_name

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
        Task.status.in_(["pending", "in_progress"]),
        Task.due_date < datetime.utcnow()
    ).all()


def get_tasks_with_assignee_name(db: Session, include_financials: bool = False):
    """
    Get tasks with assignee name joined.
    If include_financials is False, payment_amount will be None.
    """
    query = db.query(
        Task,
        User.full_name.label('assignee_name')
    ).join(User, Task.assignee_id == User.id)

    results = query.all()

    tasks = []
    for task, assignee_name in results:
        task_dict = task.__dict__.copy()
        task_dict['assignee_name'] = assignee_name

        if not include_financials:
            task_dict['payment_amount'] = None
            task_dict['is_paid'] = False

        tasks.append(task_dict)

    return tasks