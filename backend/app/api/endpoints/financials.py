from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserWithFinancials
from app.schemas.task import TaskWithFinancials
from app.crud.user import get_users
from app.crud.task import get_tasks
from app.api.deps import get_current_user
from app.models.user import User as UserModel, UserRole
from app.core.rbac import require_owner

router = APIRouter(tags=["Financials"])


@router.get("/summary")
async def get_financial_summary(
    current_user: UserModel = Depends(require_owner),
    db: Session = Depends(get_db)
):
    """Get high-level financial summary (Owner-only)"""
    total_users = db.query(UserModel).count()
    active_users = db.query(UserModel).filter(UserModel.is_active == True).count()
    
    tasks = get_tasks(db)
    total_tasks = len(tasks)
    completed_tasks = len([t for t in tasks if t.status == "completed"])
    total_payment = sum(t.payment_amount or 0 for t in tasks)
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "completion_rate": round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1),
        "total_payment_cents": total_payment,
        "total_payment_usd": f"${total_payment / 100:.2f}"
    }


@router.get("/users", response_model=list[UserWithFinancials])
async def get_all_users_with_financials(
    current_user: UserModel = Depends(require_owner),
    db: Session = Depends(get_db)
):
    """Get all users with financial data (Owner-only)"""
    users = get_users(db)
    return [UserWithFinancials.model_validate(u) for u in users]


@router.get("/tasks", response_model=list[TaskWithFinancials])
async def get_all_tasks_with_financials(
    current_user: UserModel = Depends(require_owner),
    db: Session = Depends(get_db)
):
    """Get all tasks with financial data (Owner-only)"""
    tasks = get_tasks(db)
    return [TaskWithFinancials.model_validate(t) for t in tasks]