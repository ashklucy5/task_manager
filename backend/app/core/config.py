from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application configuration settings"""
    
    # Application
    APP_NAME: str = "NexusFlow AI"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:2121@localhost:5432/nexusflow"
    
    # JWT
    SECRET_KEY: str = "DW-yj9ALLM-CTzZiSBEOV_hMHYc-zBl23fBe11vnNwM"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    
    # ========== CLOUDINARY ==========
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
    
    # ========== QINIU ==========
    QINIU_ACCESS_KEY: str = ""
    QINIU_SECRET_KEY: str = ""
    QINIU_BUCKET: str = ""
    QINIU_DOMAIN: str = ""
    
    # ========== FUTURE STORAGE OPTIONS ==========
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_BUCKET_NAME: str = ""
    AWS_REGION: str = "us-east-1"
    
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_BUCKET: str = ""
    
    # ========== EMAIL (SMTP) - ADD THESE ==========
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    # ========== STORAGE STRATEGY - ADD THIS ==========
    IMAGE_STORAGE_STRATEGY: str = "cloudinary"
    
    # ✅ ALLOW EXTRA FIELDS (optional safety net)
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # ✅ Ignore undefined env vars instead of error


settings = Settings()