"""
NexusFlow AI - Centralized Business Management Platform
FastAPI Application Entry Point
"""
import logging
import os
import traceback
from datetime import datetime, timezone
from pathlib import Path
from logging.handlers import RotatingFileHandler

from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from sqlalchemy import text

from app.database import get_db, engine, Base
from app.core.config import settings
from app.models.user import User as UserModel

from app.api.endpoints.auth import router as auth_router
from app.api.endpoints.users import router as users_router
from app.api.endpoints.tasks import router as tasks_router
from app.api.endpoints.financials import router as financials_router
from app.api.endpoints.analytics import router as analytics_router
from app.api.endpoints.companies import router as companies_router


# ==================== LOGGING ====================

LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)
log_file = LOGS_DIR / f"nexusflow_{datetime.now().strftime('%Y%m%d')}.log"

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        RotatingFileHandler(log_file, maxBytes=10*1024*1024, backupCount=5, encoding='utf-8', delay=True),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


# ==================== DATABASE INIT ====================

def init_database():
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


# ==================== CORS ====================

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    "https://task-manager-rho-six-58.vercel.app",
]

def _is_allowed_origin(origin: str) -> bool:
    return origin in ALLOWED_ORIGINS or origin.endswith(".vercel.app")

def _cors_headers(origin: str) -> dict:
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "*",
    }


# ==================== APP ====================

app = FastAPI(
    title=settings.APP_NAME,
    description="NexusFlow AI — Centralized Business Management Platform",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

if settings.FRONTEND_URL and settings.FRONTEND_URL not in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS.append(settings.FRONTEND_URL)

# CORSMiddleware handles ALL preflight OPTIONS requests automatically.
# There is NO custom middleware intercepting OPTIONS here.
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

os.makedirs("app/static", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")


# ==================== REQUEST LOGGING (only middleware) ====================

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    logger.info(f"📥 {request.method} {request.url.path} from {request.headers.get('Origin', '-')}")
    try:
        response = await call_next(request)
        elapsed = (datetime.now() - start_time).total_seconds()
        logger.info(f"📤 {request.method} {request.url.path} -> {response.status_code} ({elapsed:.3f}s)")
        return response
    except Exception as e:
        logger.error(f"❌ {request.method} {request.url.path}: {e}", exc_info=True)
        raise


# ==================== STARTUP / SHUTDOWN ====================

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 NexusFlow AI API starting up...")
    logger.info(f"🔵 DEBUG={settings.DEBUG}")
    logger.info(f"🔵 ALLOWED_ORIGINS={ALLOWED_ORIGINS}")
    if settings.DEBUG:
        init_database()
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        db.close()
        logger.info("✅ Database connection verified")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}", exc_info=True)
    logger.info("✅ NexusFlow AI API ready")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 NexusFlow AI API shutting down...")


# ==================== EXCEPTION HANDLERS ====================

@app.exception_handler(OperationalError)
async def operational_error_handler(request: Request, exc: OperationalError):
    logger.error(f"❌ DB operational error: {exc}", exc_info=True)
    origin = request.headers.get("Origin", "")
    headers = _cors_headers(origin) if _is_allowed_origin(origin) else {}
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Database unavailable. Please try again later."},
        headers=headers or None,
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning(f"⚠️ HTTP {exc.status_code}: {exc.detail}")
    origin = request.headers.get("Origin", "")
    headers = _cors_headers(origin) if _is_allowed_origin(origin) else {}
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=headers or None,
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"❌ Unhandled exception: {exc}", exc_info=True)
    origin = request.headers.get("Origin", "")
    headers = _cors_headers(origin) if _is_allowed_origin(origin) else {}
    if settings.DEBUG:
        content = {
            "detail": "Internal server error",
            "debug": str(exc),
            "traceback": traceback.format_exc(),
        }
    else:
        content = {"detail": "Internal server error"}
    return JSONResponse(status_code=500, content=content, headers=headers or None)


# ==================== ROUTERS ====================

app.include_router(auth_router,       prefix="/api/auth",       tags=["Authentication"])
app.include_router(users_router,      prefix="/api/users",      tags=["Users"])
app.include_router(tasks_router,      prefix="/api/tasks",      tags=["Tasks"])
app.include_router(financials_router, prefix="/api/financials", tags=["Financials"])
app.include_router(analytics_router,  prefix="/api/analytics",  tags=["Analytics"])
app.include_router(companies_router,  prefix="/api/companies",  tags=["Companies"])


# ==================== HEALTH / ROOT ====================

@app.get("/health")
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
        checks["database"] = f"unhealthy: {e}"
        checks["app"] = "degraded"
    code = status.HTTP_200_OK if checks["database"] == "healthy" else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(status_code=code, content=checks)


@app.get("/")
async def root():
    return {
        "service": settings.APP_NAME,
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs" if settings.DEBUG else None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=getattr(settings, "HOST", "0.0.0.0"),
        port=int(getattr(settings, "PORT", os.getenv("PORT", 8000))),
        reload=settings.DEBUG,
    )