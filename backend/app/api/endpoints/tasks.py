from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.task import TaskResponse, TaskWithFinancials, TaskCreate, TaskUpdate, TaskStatusUpdate
from app.crud.task import (
    get_task, get_tasks, get_user_tasks, create_task, update_task,
    update_task_status, delete_task, get_tasks_with_assignee_name,
    update_task_requirements, update_task_checklist, update_task_image,
    delete_task_image, update_task_client_info
)
from app.utils.image_storage import ImageStorageService
from app.api.deps import get_current_user
from app.models.user import User as UserModel
from typing import Optional
import os
import uuid

router = APIRouter(tags=["Tasks"])


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
    """Get task by ID"""
    db_task = get_task(db, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # String-based role check
    if current_user.role.lower() in ["member", "contributor", "employee"] and db_task.assignee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view tasks assigned to you"
        )
    
    return TaskResponse.model_validate(db_task)


@router.get("/", response_model=list[TaskResponse])
async def read_tasks(
    skip: int = 0,
    limit: int = 100,
    assignee_id: Optional[int] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List tasks with filters"""
    user_role = current_user.role.lower()
    
    if user_role in ["owner", "admin", "facilitator"]:
        tasks = get_tasks(db, skip, limit, assignee_id, status, priority, category)
    elif user_role in ["member", "contributor", "employee"]:
        tasks = get_user_tasks(db, current_user.id)
    else:
        raise HTTPException(status_code=403, detail="Invalid role")
    
    return [TaskResponse.model_validate(t) for t in tasks]


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task_endpoint(
    task: TaskCreate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new task"""
    if current_user.role.lower() not in ["owner", "admin", "facilitator"]:
        raise HTTPException(status_code=403, detail="Owner/Admin access required")
    
    db_task = create_task(db, task, assigned_by_id=current_user.id)
    return TaskResponse.model_validate(db_task)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task_endpoint(
    task_id: int,
    task_update: TaskUpdate,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update task"""
    db_task = get_task(db, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    user_role = current_user.role.lower()
    
    if user_role in ["member", "contributor", "employee"]:
        if task_update.model_dump(exclude_unset=True) != {"status": task_update.status}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Employees can only update task status"
            )
    
    if user_role != "owner":
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
    """Update task status only"""
    db_task = get_task(db, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    user_role = current_user.role.lower()
    if user_role in ["member", "contributor", "employee"] and db_task.assignee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update tasks assigned to you"
        )
    
    updated_task = update_task_status(db, task_id, status_update.status)
    return TaskResponse.model_validate(updated_task)


# ==================== REQUIREMENTS ENDPOINTS ====================

@router.put("/{task_id}/requirements", response_model=TaskResponse)
async def update_task_requirements_endpoint(
    task_id: int,
    requirements: str,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update task requirements (Owner/Admin only)"""
    user_role = current_user.role.lower()
    if user_role in ["member", "contributor", "employee"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Owner/Admin can update requirements"
        )
    
    updated_task = update_task_requirements(db, task_id, requirements)
    return TaskResponse.model_validate(updated_task)


@router.put("/{task_id}/checklist", response_model=TaskResponse)
async def update_task_checklist_endpoint(
    task_id: int,
    checklist: list,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update task requirements checklist"""
    db_task = get_task(db, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    user_role = current_user.role.lower()
    if user_role in ["member", "contributor", "employee"] and db_task.assignee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update checklist for tasks assigned to you"
        )
    
    updated_task = update_task_checklist(db, task_id, checklist)
    return TaskResponse.model_validate(updated_task)


# ==================== IMAGE ENDPOINTS (Dual Storage) ====================

@router.post("/{task_id}/image", response_model=TaskResponse)
async def upload_task_image(
    task_id: int,
    file: UploadFile = File(...),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload task image to both Cloudinary and Qiniu"""
    db_task = get_task(db, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    file_bytes = await file.read()
    result = await ImageStorageService.upload_image(
        file_bytes=file_bytes,
        filename=file.filename,
        folder="tasks"
    )
    
    if not result["cloudinary_url"] and not result["qiniu_url"]:
        raise HTTPException(status_code=500, detail="Failed to upload image")
    
    updated_task = update_task_image(db, task_id, result["primary_url"], file.filename)
    updated_task.image_cloudinary_url = result["cloudinary_url"]
    updated_task.image_qiniu_url = result["qiniu_url"]
    updated_task.image_cloudinary_public_id = result["cloudinary_public_id"]
    updated_task.image_qiniu_key = result["qiniu_key"]
    
    db.commit()
    db.refresh(updated_task)
    return TaskResponse.model_validate(updated_task)


@router.delete("/{task_id}/image", response_model=TaskResponse)
async def delete_task_image_endpoint(
    task_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete task image from both services"""
    db_task = get_task(db, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if db_task.image_cloudinary_public_id or db_task.image_qiniu_key:
        await ImageStorageService.delete_image(
            cloudinary_public_id=db_task.image_cloudinary_public_id,
            qiniu_key=db_task.image_qiniu_key
        )
        
        updated_task = delete_task_image(db, task_id)
        return TaskResponse.model_validate(updated_task)
    
    raise HTTPException(status_code=404, detail="No image to delete")


# ==================== CLIENT INFO ENDPOINTS ====================

@router.put("/{task_id}/client-info", response_model=TaskResponse)
async def update_task_client_info_endpoint(
    task_id: int,
    client_name: Optional[str] = None,
    company_name: Optional[str] = None,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update task client/company details (Owner/Admin only)"""
    user_role = current_user.role.lower()
    if user_role in ["member", "contributor", "employee"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Owner/Admin can update client info"
        )
    
    updated_task = update_task_client_info(db, task_id, client_name, company_name)
    return TaskResponse.model_validate(updated_task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task_endpoint(
    task_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a task (Owner/Admin only)"""
    user_role = current_user.role.lower()
    if user_role not in ["owner", "admin", "facilitator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Owner/Admin can delete tasks"
        )
    
    success = delete_task(db, task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")


@router.get("/financial", response_model=list[TaskWithFinancials])
async def read_tasks_with_financials(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all tasks with financial data (Owner-only)"""
    if current_user.role.lower() != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Owner can view financial data"
        )
    
    tasks = get_tasks_with_assignee_name(db, include_financials=True)
    return [TaskWithFinancials.model_validate(t) for t in tasks]