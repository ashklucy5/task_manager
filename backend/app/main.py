"""
NexusFlow AI - Centralized Business Management Platform
FastAPI Application Entry Point
"""
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from logging.handlers import RotatingFileHandler
from typing import Dict

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


# ==================== FASTAPI APP ====================

app = FastAPI(
    title=settings.APP_NAME,
    description="NexusFlow AI — Centralized Business Management Platform",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

origins = [
    "http://localhost:5173",  # Local development
    "http://localhost:3000",  # Alternative local port
    "https://task-manager-rho-six-58.vercel.app",  # ✅ Your Vercel domain from screenshot
    "https://*.vercel.app",  # All Vercel preview deployments
]
if settings.FRONTEND_URL and settings.FRONTEND_URL not in origins:
    origins.append(settings.FRONTEND_URL)

# ✅ CORS Middleware - MUST BE BEFORE ROUTERS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
os.makedirs("app/static", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")


# ==================== REQUEST LOGGING ====================

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests"""
    start_time = datetime.now()
    
    logger.info(f"📥 {request.method} {request.url.path}")
    
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
    
    if settings.DEBUG:
        init_database()
    
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        db.close()
        logger.info("✅ Database connection verified")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}", exc_info=True)
    
    logger.info(f"✅ NexusFlow AI API ready")


@app.on_event("shutdown")
async def shutdown_event():
    """Run on application shutdown"""
    logger.info("🛑 NexusFlow AI API shutting down...")


# ==================== EXCEPTION HANDLERS ====================

@app.exception_handler(OperationalError)
async def operational_error_handler(request: Request, exc: OperationalError):
    logger.error(f"❌ Database operational error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "detail": "Database unavailable. Please try again later.",
            "error": str(exc) if settings.DEBUG else None
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    import traceback
    
    logger.error(f"❌ Unhandled exception: {str(exc)}", exc_info=True)
    
    if settings.DEBUG:
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error",
                "debug": str(exc),
                "traceback": traceback.format_exc()
            }
        )
    
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
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
    """Health check endpoint"""
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
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
# """
# NexusFlow AI - Centralized Business Management Platform
# FastAPI Application Entry Point
# """
# import logging
# import os
# import sys
# from datetime import datetime, timezone
# from typing import Dict

# from fastapi import FastAPI, Depends, HTTPException, status, Request
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.responses import JSONResponse
# from fastapi.staticfiles import StaticFiles  # ✅ NEW: For serving images
# from sqlalchemy.orm import Session
# from sqlalchemy.exc import OperationalError
# from sqlalchemy import text

# # Import core modules
# from app.database import get_db, engine, Base
# from app.core.config import settings
# from app.models.user import User as UserModel

# # ✅ FIXED: Import routers with proper aliasing
# # Each endpoint file exports `router = APIRouter(...)`, so we alias them here
# from app.api.endpoints.auth import router as auth_router
# from app.api.endpoints.users import router as users_router
# from app.api.endpoints.tasks import router as tasks_router
# from app.api.endpoints.financials import router as financials_router
# from app.api.endpoints.analytics import router as analytics_router
# from app.api.endpoints.companies import router as companies_router


# # ==================== DATABASE INITIALIZATION ====================
# # Configure logging
# logging.basicConfig(
#     level=logging.DEBUG,
#     format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
# )
# logger = logging.getLogger(__name__)
# def init_database():
#     """Initialize database: create DB if missing + run migrations"""
#     if not settings.DEBUG:
#         return
    
#     try:
#         from database_init import create_database_if_not_exists
#         from alembic_utils import run_migrations
        
#         create_database_if_not_exists()
        
#         try:
#             Base.metadata.create_all(bind=engine)
#         except Exception:
#             pass
        
#         try:
#             run_migrations()
#         except Exception:
#             pass
        
#     except ImportError:
#         pass
#     except Exception:
#         pass


# # ==================== FASTAPI APP SETUP ====================

# app = FastAPI(
#     title=settings.APP_NAME,
#     description="NexusFlow AI — Centralized Business Management Platform with strict financial privacy controls",
#     version="1.0.0",
#     docs_url="/docs" if settings.DEBUG else None,
#     redoc_url="/redoc" if settings.DEBUG else None,
#     openapi_url="/openapi.json" if settings.DEBUG else None,
# )

# # CORS Middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ✅ NEW: Mount static files for avatars and task images
# # This serves files from app/static/ at /static/ URL path
# app.mount("/static", StaticFiles(directory="app/static"), name="static")


# # ==================== STARTUP/SHUTDOWN EVENTS ====================

# @app.on_event("startup")
# async def startup_event():
#     """Run on application startup"""
    
#     # Initialize database on startup (dev only)
#     if settings.DEBUG:
#         init_database()
    
#     # Verify database connection
#     try:
#         db = next(get_db())
#         db.execute(text("SELECT 1"))
#         db.close()
#     except Exception:
#         if settings.DEBUG:
#             pass


# @app.on_event("shutdown")
# async def shutdown_event():
#     """Run on application shutdown"""
#     # Optional: Set all users offline on shutdown
#     # (Skip in production - handle via session timeout instead)
#     pass


# # ==================== EXCEPTION HANDLERS ====================

# @app.exception_handler(OperationalError)
# async def operational_error_handler(request: Request, exc: OperationalError):
#     return JSONResponse(
#         status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
#         content={
#             "detail": "Database unavailable. Please try again later.",
#             "error": str(exc)
#         },
#     )


# # ✅ OPTIONAL: Global debug handler (remove for production)
# @app.exception_handler(Exception)
# async def global_exception_handler(request: Request, exc: Exception):
#     import traceback
#     if settings.DEBUG:
#         print("🔥 FULL TRACEBACK:")
#         print(traceback.format_exc())
#         return JSONResponse(
#             status_code=500,
#             content={"detail": "Internal server error", "debug": str(exc)}
#         )
#     # Production: return generic error
#     return JSONResponse(
#         status_code=500,
#         content={"detail": "Internal server error"}
#     )


# # ==================== ROUTERS ====================

# app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
# app.include_router(users_router, prefix="/api/users", tags=["Users"])
# app.include_router(tasks_router, prefix="/api/tasks", tags=["Tasks"])
# app.include_router(financials_router, prefix="/api/financials", tags=["Financials"])
# app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
# app.include_router(companies_router, prefix="/api/companies", tags=["Companies"])


# # ==================== HEALTH CHECKS ====================

# @app.get("/health", include_in_schema=False)
# async def health_check(db: Session = Depends(get_db)):
#     checks = {
#         "app": "healthy",
#         "database": "unknown",
#         "timestamp": datetime.now(timezone.utc).isoformat()
#     }
    
#     try:
#         db.execute(text("SELECT 1"))
#         checks["database"] = "healthy"
#     except Exception as e:
#         checks["database"] = f"unhealthy: {str(e)}"
#         checks["app"] = "degraded"
    
#     status_code = status.HTTP_200_OK if checks["database"] == "healthy" else status.HTTP_503_SERVICE_UNAVAILABLE
#     return JSONResponse(status_code=status_code, content=checks)


# @app.get("/", include_in_schema=False)
# async def root():
#     return {
#         "service": settings.APP_NAME,
#         "status": "running",
#         "version": "1.0.0",
#         "docs": "/docs" if settings.DEBUG else None,
#         "environment": "development" if settings.DEBUG else "production",
#         "timestamp": datetime.now(timezone.utc).isoformat()
#     }