from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application configuration settings"""
    
    # Application Info
    APP_NAME: str = "NexusFlow AI"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/nexusflow"
    
    # JWT Settings
    SECRET_KEY: str = "your-super-secret-key-change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # CORS
    FRONTEND_URL: str = "http://localhost:5173"
    
    # Email (Optional)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()