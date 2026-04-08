"""
NexusFlow AI - Centralized Business Management Platform
FastAPI Application Entry Point
"""
import logging
import os
import sys
import traceback
from datetime import datetime, timezone
from pathlib import Path
from logging.handlers import RotatingFileHandler
from typing import Dict, Optional

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from sqlalchemy import text

# Import core modules
from app.database import get_db, engine, Base
from app.core.config import settings
from app.models.user import User as UserModel

# Import routers
from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.users import router as users_router
from app.api.endpoints.tasks import router as tasks_router
from app.api.endpoints.financials import router as financials_router
from app.api.endpoints.analytics import router as analytics_router
from app.api.endpoints.companies import router as companies_router


# ==================== LOGGING SETUP ====================

LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)

log_file = LOGS_DIR / f"nexusflow_{datetime.now().strftime('%Y%m%d')}.log"

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,
            backupCount=5,
            encoding='utf-8',
            delay=True
        ),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


# ==================== DATABASE INIT ====================

def init_database():
    """Initialize database"""
    if not settings.DEBUG:
        return
    
    try:
        from database_init import create_database_if_not_exists
        from alembic_utils import run_migrations
        
        create_database_if_not_exists()
        
        try:
            Base.metadata.create_all(bind=engine)
        except Exception as e:
            logger.warning(f"Could not create tables: {e}")
        
        try:
            run_migrations()
        except Exception as e:
            logger.warning(f"Could not run migrations: {e}")
        
    except ImportError as e:
        logger.warning(f"Database init modules not found: {e}")
    except Exception as e:
        logger.error(f"Database initialization error: {e}", exc_info=True)


# ==================== CORS CONFIGURATION ====================

def get_allowed_origins() -> list:
    """Build list of allowed CORS origins"""
    origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:4173",
    ]
    
    # Add FRONTEND_URL from settings if provided
    if settings.FRONTEND_URL and settings.FRONTEND_URL not in origins:
        origins.append(settings.FRONTEND_URL)
    
    logger.info(f"🔵 CORS allowed origins: {origins}")
    return origins


# ==================== FASTAPI APP ====================

app = FastAPI(
    title=settings.APP_NAME,
    description="NexusFlow AI — Centralized Business Management Platform",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

# ✅ CORS Middleware - MUST BE BEFORE ROUTERS
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_origin_regex=r"^https://.*\.vercel\.app$",  # ✅ Allow all Vercel preview domains
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ✅ Custom middleware to ensure CORS headers on ALL responses (including errors)
@app.middleware("http")
async def ensure_cors_headers(request: Request, call_next):
    """Ensure CORS headers are added to all responses, including errors"""
    origin = request.headers.get("Origin")
    
    # Handle preflight OPTIONS request
    if request.method == "OPTIONS":
        if origin and (origin in get_allowed_origins() or 
                      (origin and origin.endswith(".vercel.app"))):
            return JSONResponse(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": origin,
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Allow-Credentials": "true",
                    "Access-Control-Max-Age": "86400",
                }
            )
        return JSONResponse(status_code=400, content={"detail": "CORS not allowed for this origin"})
    
    # Process the actual request
    try:
        response = await call_next(request)
    except Exception as e:
        # Log the error but let the exception handler deal with it
        logger.error(f"❌ Request processing error: {str(e)}", exc_info=True)
        raise
    
    # Add CORS headers to response if origin is allowed
    if origin:
        is_allowed = (
            origin in get_allowed_origins() or 
            (origin.endswith(".vercel.app"))
        )
        if is_allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, PATCH, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response

# Mount static files
os.makedirs("app/static", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")


# ==================== REQUEST LOGGING ====================

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing"""
    start_time = datetime.now()
    
    logger.info(f"📥 {request.method} {request.url.path} from {request.headers.get('Origin', 'unknown')}")
    
    try:
        response = await call_next(request)
        process_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"📤 {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.3f}s")
        return response
    except Exception as e:
        logger.error(f"❌ Exception in {request.method} {request.url.path}: {str(e)}", exc_info=True)
        raise


# ==================== STARTUP/SHUTDOWN ====================

@app.on_event("startup")
async def startup_event():
    """Run on application startup"""
    logger.info("🚀 NexusFlow AI API starting up...")
    logger.info(f"🔵 Environment: {'DEBUG' if settings.DEBUG else 'PRODUCTION'}")
    logger.info(f"🔵 FRONTEND_URL: {settings.FRONTEND_URL}")
    logger.info(f"🔵 DATABASE_URL: {settings.DATABASE_URL[:50] if settings.DATABASE_URL else 'NOT SET'}...")
    
    if settings.DEBUG:
        init_database()
    
    # Verify database connection
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        db.close()
        logger.info("✅ Database connection verified")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}", exc_info=True)
    
    logger.info(f"✅ NexusFlow AI API ready on port {os.getenv('PORT', 8000)}")


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info("🛑 NexusFlow AI API shutting down...")


# ==================== EXCEPTION HANDLERS ====================

@app.exception_handler(OperationalError)
async def operational_error_handler(request: Request, exc: OperationalError):
    """Handle database operational errors"""
    logger.error(f"❌ Database operational error: {exc}", exc_info=True)
    
    # Add CORS headers to error response
    origin = request.headers.get("Origin")
    headers = {}
    if origin and (origin in get_allowed_origins() or origin.endswith(".vercel.app")):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "detail": "Database unavailable. Please try again later.",
            "error": str(exc) if settings.DEBUG else None
        },
        headers=headers if headers else None
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with CORS headers"""
    logger.warning(f"⚠️ HTTP {exc.status_code}: {exc.detail}")
    
    # Add CORS headers to error response
    origin = request.headers.get("Origin")
    headers = {}
    if origin and (origin in get_allowed_origins() or origin.endswith(".vercel.app")):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers if headers else None
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler with full traceback in debug mode"""
    logger.error(f"❌ Unhandled exception: {str(exc)}", exc_info=True)
    
    # Add CORS headers to error response
    origin = request.headers.get("Origin")
    headers = {}
    if origin and (origin in get_allowed_origins() or origin.endswith(".vercel.app")):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    
    if settings.DEBUG:
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "debug": str(exc),
                "traceback": traceback.format_exc()
            },
            headers=headers if headers else None
        )
    
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers=headers if headers else None
    )


# ==================== ROUTERS ====================

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(tasks_router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(financials_router, prefix="/api/financials", tags=["Financials"])
app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(companies_router, prefix="/api/companies", tags=["Companies"])


# ==================== HEALTH CHECKS ====================

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint for monitoring"""
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


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": settings.APP_NAME,
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs" if settings.DEBUG else None,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"🔧 Starting server on {settings.HOST}:{settings.PORT}")
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST or "0.0.0.0",
        port=int(settings.PORT or os.getenv("PORT", 8000)),
        reload=settings.DEBUG,
    )