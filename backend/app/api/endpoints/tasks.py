from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.task import TaskResponse, TaskWithFinancials, TaskCreate, TaskUpdate, TaskStatusUpdate
from app.crud.task import (
    get_task, get_tasks, get_user_tasks, create_task, update_task,
    update_task_status, delete_task, get_tasks_with_assignee_name
)
from app.api.deps import get_current_user
from app.models.user import User as UserModel, UserRole
from app.core.rbac import require_owner, require_role, can_view_financials
from datetime import datetime, timezone

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("/me", response_model=list[TaskResponse])
async def read_my_tasks(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get tasks assigned to current user"""
    tasks = get_user_tasks(db, current_user.id)
    return [TaskResponse.model_validate(t) for t in tasks]


@router.get("/{task_id}", response_model=TaskResponse)
async def read_task(
    task_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get task by ID (Owner sees all; Admin sees team; Employee only assigned)"""
    db_task = get_task(db, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Employees can only see tasks assigned to them
    if current_user.role == UserRole.EMPLOYEE and db_task.assignee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view tasks assigned to you"
        )
    
    return TaskResponse.model_validate(db_task)


@router.get("/", response_model=list[TaskResponse])
async def read_tasks(
    skip: int = 0,
    limit: int = 100,
    assignee_id: int | None = None,
    status: str | None = None,
    priority: str | None = None,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List tasks with filters (role-scoped)"""
    # Build query based on role
    if current_user.role == UserRole.OWNER:
        tasks = get_tasks(db, skip, limit, assignee_id, status, priority)
    elif current_user.role == UserRole.ADMIN:
        # In real app: filter by department/team
        tasks = get_tasks(db, skip, limit, assignee_id, status, priority)
    elif current_user.role == UserRole.EMPLOYEE:
        tasks = get_user_tasks(db, current_user.id)
    else:
        raise HTTPException(status_code=403, detail="Invalid role")
    
    return [TaskResponse.model_validate(t) for t in tasks]


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task_endpoint(
    task: TaskCreate,
    current_user: UserModel = Depends(require_role(UserRole.ADMIN)),  # Owner/Admin can create
    db: Session = Depends(get_db)
):
    """Create a new task"""
    db_task = create_task(db, task, assigned_by_id=current_user.id)
    return TaskResponse.model_validate(db_task)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task_endpoint(
    task_id: int,
    task_update: TaskUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update task (Owner/Admin can edit; Employee can only update status)"""
    db_task = get_task(db, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Employees can only update status
    if current_user.role == UserRole.EMPLOYEE:
        if task_update.model_dump(exclude_unset=True) != {"status": task_update.status}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Employees can only update task status"
            )
    
    # Owner can update financial fields; others cannot
    if current_user.role != UserRole.OWNER:
        task_update.payment_amount = None
        task_update.is_paid = None
    
    updated_task = update_task(db, task_id, task_update)
    if not updated_task:
        raise HTTPException(status_code=500, detail="Failed to update task")
    
    return TaskResponse.model_validate(updated_task)


@router.patch("/{task_id}/status", response_model=TaskResponse)
async def update_task_status_endpoint(
    task_id: int,
    status_update: TaskStatusUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update task status only (all roles can do this)"""
    db_task = get_task(db, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Employees can update their own tasks
    if current_user.role == UserRole.EMPLOYEE and db_task.assignee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update tasks assigned to you"
        )
    
    updated_task = update_task_status(db, task_id, status_update.status)
    return TaskResponse.model_validate(updated_task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task_endpoint(
    task_id: int,
    current_user: UserModel = Depends(require_owner),  # Only Owner can delete
    db: Session = Depends(get_db)
):
    """Delete a task (Owner-only)"""
    success = delete_task(db, task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"detail": "Task deleted successfully"}


# Owner-only: Get tasks with financial data
@router.get("/financial", response_model=list[TaskWithFinancials])
async def read_tasks_with_financials(
    current_user: UserModel = Depends(require_owner),
    db: Session = Depends(get_db)
):
    """Get all tasks with financial data (Owner-only)"""
    tasks = get_tasks_with_assignee_name(db, include_financials=True)
    return [TaskWithFinancials.model_validate(t) for t in tasks]