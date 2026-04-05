from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os


class Settings(BaseSettings):
    """Application configuration settings - loaded from .env + environment variables"""
    
    # ==================== PYDANTIC V2 CONFIG ====================
    model_config = SettingsConfigDict(
        env_file=".env",           # ✅ Load from .env file
        env_file_encoding="utf-8", # ✅ Encoding for .env
        case_sensitive=True,       # ✅ Environment variables are case-sensitive
        extra="ignore",            # ✅ Ignore undefined env vars (safety net)
    )
    
    # ==================== APPLICATION ====================
    APP_NAME: str = "NexusFlow AI"
    DEBUG: bool = True
    
    # ==================== DATABASE ====================
    # ✅ Will load from DATABASE_URL env var or .env
    DATABASE_URL: str
    
    # ==================== JWT ====================
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # ==================== CORS ====================
    FRONTEND_URL: str = "http://localhost:5173"
    
    # ==================== CLOUDINARY ====================
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None
    
    # ==================== QINIU ====================
    QINIU_ACCESS_KEY: Optional[str] = None
    QINIU_SECRET_KEY: Optional[str] = None
    QINIU_BUCKET: Optional[str] = None
    QINIU_DOMAIN: Optional[str] = None
    
    # ==================== FUTURE STORAGE OPTIONS ====================
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_BUCKET_NAME: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_BUCKET: Optional[str] = None
    
    # ==================== EMAIL (SMTP) ====================
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    # ==================== STORAGE STRATEGY ====================
    IMAGE_STORAGE_STRATEGY: str = "cloudinary"
    
    # ==================== VALIDATORS ====================
    def validate_required_fields(self):
        """Validate that required fields are set"""
        required = ["DATABASE_URL", "SECRET_KEY"]
        missing = [field for field in required if not getattr(self, field)]
        if missing:
            raise ValueError(f"Missing required settings: {', '.join(missing)}")
        return self


# ✅ Create settings instance
settings = Settings()

# ✅ Validate on startup (optional but recommended)
try:
    settings.validate_required_fields()
except ValueError as e:
    import logging
    logger = logging.getLogger(__name__)
    logger.warning(f"⚠️ Settings validation warning: {e}")
    # Don't crash - let the app start and fail later if needed