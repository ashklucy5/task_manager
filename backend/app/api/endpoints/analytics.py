from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User as UserModel
from typing import List, Dict

router = APIRouter(tags=["Analytics"])


@router.get("/team-performance")
async def get_team_performance(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Team performance metrics (SuperAdmin only)"""
    if current_user.role.lower() != "super_admin":
        raise HTTPException(status_code=403, detail="SuperAdmin access required")
    
    return {
        "company_id": current_user.company_id,
        "overview": {
            "total_tasks": 42,
            "completed": 31,
            "overdue": 5,
            "in_progress": 6,
            "completion_rate": 73.8
        },
        "by_employee": [
            {
                "id": 1,
                "user_id": "S-000001-A-00001-M-0000001",
                "name": "Alex Chen",
                "tasks_completed": 8,
                "avg_completion_time_days": 2.1,
                "capacity_utilization": 42,
                "status": "ACTIVE"
            },
            {
                "id": 2,
                "user_id": "S-000001-A-00001-M-0000002",
                "name": "Sarah Kim",
                "tasks_completed": 12,
                "avg_completion_time_days": 3.4,
                "capacity_utilization": 75,
                "status": "BUSY"
            }
        ],
        "by_category": [
            {"category": "development", "count": 18, "completion_rate": 83.3},
            {"category": "design", "count": 15, "completion_rate": 66.7},
            {"category": "marketing", "count": 9, "completion_rate": 77.8}
        ]
    }


@router.get("/workload-balance")
async def get_workload_balance(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Workload distribution across team (SuperAdmin only)"""
    if current_user.role.lower() != "super_admin":
        raise HTTPException(status_code=403, detail="SuperAdmin access required")
    
    return {
        "company_id": current_user.company_id,
        "balance_score": 87,
        "overloaded": ["Jon Rossi"],
        "underutilized": ["James O'Neil"],
        "recommendations": [
            "Reassign 'Database Migration' from Jon Rossi to James O'Neil",
            "Increase Sarah Kim's task load by 2 tasks"
        ]
    }