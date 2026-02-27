"""
NexusFlow AI - Centralized Business Management Platform
FastAPI Application Entry Point
"""
import os
import sys
import logging
from datetime import datetime, timezone
from typing import Dict

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from sqlalchemy import text  # ✅ REQUIRED for SQLAlchemy 2.0

# Import core modules
from app.database import get_db, engine, Base
from app.core.config import settings
from app.models.user import User as UserModel
from sqlalchemy import text

# Import routers AFTER models to avoid circular imports
from app.api.endpoints import (
    auth_router,
    users_router,
    tasks_router,
    financials_router,
    analytics_router
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


# ==================== DATABASE INITIALIZATION ====================

def init_database():
    """Initialize database: create DB if missing + run migrations"""
    if not settings.DEBUG:
        logger.info("Production mode: Skipping auto-database creation")
        return
    
    logger.info("🔧 Development mode: Initializing database...")
    
    # ✅ FIXED: Correct import name (was 'database_initt' typo)
    try:
        from database_init import create_database_if_not_exists
        from alembic_utils import run_migrations
        
        # Create database if missing
        create_database_if_not_exists()
        
        # Create tables directly (fallback for first run)
        try:
            Base.metadata.create_all(bind=engine)
            logger.info("✅ Created database tables (direct)")
        except Exception as e:
            logger.warning(f"⚠️ Direct table creation warning (expected if using Alembic): {e}")
        
        # Run migrations (non-blocking - app should start even if migrations fail)
        try:
            run_migrations()
        except Exception as e:
            logger.warning(f"⚠️ Migrations skipped: {e}")
            logger.warning("💡 App will start using direct table creation")
        
        logger.info("✅ Database initialization complete")
        
    except ImportError as e:
        logger.warning(f"⚠️ Database initialization scripts not found: {e}")
        logger.warning("💡 Hint: Create database_init.py and alembic_utils.py for auto-init")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        # ✅ DO NOT EXIT - let app start if DB already exists
        logger.info("⚠️ Continuing startup (database may already exist)")


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
    logger.info(f"🚀 Starting {settings.APP_NAME} (DEBUG={settings.DEBUG})")
    
    # Initialize database on startup (dev only)
    if settings.DEBUG:
        init_database()
    
    # ✅ FIXED: Use text() wrapper for raw SQL (SQLAlchemy 2.0 requirement)
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))  # ✅ WRAPPED IN text()
        logger.info("✅ Database connection verified")
        db.close()
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        if settings.DEBUG:
            logger.error("💡 Check: Is PostgreSQL running? Is DATABASE_URL correct in .env?")
    
    logger.info(f"✅ {settings.APP_NAME} ready at http://localhost:8000")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info(f"🛑 Shutting down {settings.APP_NAME}")


# ==================== EXCEPTION HANDLERS ====================

@app.exception_handler(OperationalError)
async def operational_error_handler(request: Request, exc: OperationalError):
    logger.error(f"Database error: {exc}")
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
        # ✅ FIXED: Use text() wrapper
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