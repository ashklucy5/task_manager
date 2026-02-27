"""
NexusFlow AI - Centralized Business Management Platform
FastAPI Application Entry Point
"""
import os
import sys
from datetime import datetime, timezone
from typing import Dict

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from sqlalchemy import text

# Import core modules
from app.database import get_db, engine, Base
from app.core.config import settings
from app.models.user import User as UserModel

# Import routers AFTER models to avoid circular imports
from app.api.endpoints import (
    auth_router,
    users_router,
    tasks_router,
    financials_router,
    analytics_router
)


# ==================== DATABASE INITIALIZATION ====================

def init_database():
    """Initialize database: create DB if missing + run migrations"""
    if not settings.DEBUG:
        return
    
    # ✅ FIXED: Correct import name (was 'database_initt' typo)
    try:
        from database_init import create_database_if_not_exists
        from alembic_utils import run_migrations
        
        # Create database if missing
        create_database_if_not_exists()
        
        # Create tables directly (fallback for first run)
        try:
            Base.metadata.create_all(bind=engine)
        except Exception as e:
            pass
        
        # Run migrations (non-blocking - app should start even if migrations fail)
        try:
            run_migrations()
        except Exception as e:
            pass
        
    except ImportError as e:
        pass
    except Exception as e:
        pass


# ==================== FASTAPI APP SETUP ====================

app = FastAPI(
    title=settings.APP_NAME,
    description="NexusFlow AI — Centralized Business Management Platform with strict financial privacy controls",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== STARTUP/SHUTDOWN EVENTS ====================

@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    
    # Initialize database on startup (dev only)
    if settings.DEBUG:
        init_database()
    
    # ✅ FIXED: Use text() wrapper for raw SQL (SQLAlchemy 2.0 requirement)
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        db.close()
    except Exception as e:
        if settings.DEBUG:
            pass
    
    # Removed log message


@app.on_event("shutdown")
async def shutdown_event():
    pass


# ==================== EXCEPTION HANDLERS ====================

@app.exception_handler(OperationalError)
async def operational_error_handler(request: Request, exc: OperationalError):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "detail": "Database unavailable. Please try again later.",
            "error": str(exc)
        },
    )


# ==================== ROUTERS ====================

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(tasks_router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(financials_router, prefix="/api/financials", tags=["Financials"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])


# ==================== HEALTH CHECKS ====================

@app.get("/health", include_in_schema=False)
async def health_check(db: Session = Depends(get_db)):
    checks = {
        "app": "healthy",
        "database": "unknown",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = "healthy"
    except Exception as e:
        checks["database"] = f"unhealthy: {str(e)}"
        checks["app"] = "degraded"
    
    status_code = status.HTTP_200_OK if checks["database"] == "healthy" else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(status_code=status_code, content=checks)


@app.get("/", include_in_schema=False)
async def root():
    return {
        "service": settings.APP_NAME,
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs" if settings.DEBUG else None,
        "environment": "development" if settings.DEBUG else "production",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# Add this temporarily for debugging
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    print("🔥 FULL TRACEBACK:")
    print(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "debug": str(exc)}
    )