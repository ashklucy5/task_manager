# Import and expose all routers for inclusion in main.py
from .auth import router as auth_router
from .users import router as users_router
from .tasks import router as tasks_router
from .financials import router as financials_router
from .analytics import router as analytics_router

__all__ = [
    "auth_router",
    "users_router",
    "tasks_router",
    "financials_router",
    "analytics_router"
]