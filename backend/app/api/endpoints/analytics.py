from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User as UserModel, UserRole
from app.core.rbac import require_owner
from datetime import datetime, timedelta
from typing import List, Dict

router = APIRouter(tags=["Analytics"])


@router.get("/team-performance")
async def get_team_performance(
    current_user: UserModel = Depends(require_owner),
    db: Session = Depends(get_db)
):
    """Team performance metrics (Owner-only)"""
    # Mock data — replace with real queries later
    return {
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
                "name": "Alex Chen",
                "tasks_completed": 8,
                "avg_completion_time_days": 2.1,
                "capacity_utilization": 42
            },
            {
                "id": 2,
                "name": "Sarah Kim",
                "tasks_completed": 12,
                "avg_completion_time_days": 3.4,
                "capacity_utilization": 75
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
    current_user: UserModel = Depends(require_owner),
    db: Session = Depends(get_db)
):
    """Workload distribution across team (Owner-only)"""
    return {
        "balance_score": 87,  # 0-100 (higher = more balanced)
        "overloaded": ["Jon Rossi"],
        "underutilized": ["James O'Neil"],
        "recommendations": [
            "Reassign 'Database Migration' from Jon Rossi to James O'Neil",
            "Increase Sarah Kim's task load by 2 tasks"
        ]
    }