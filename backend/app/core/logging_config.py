# backend/app/core/logging_config.py

import logging
import os
from datetime import datetime
from pathlib import Path

# Create logs directory
LOGS_DIR = Path("logs")
LOGS_DIR.mkdir(exist_ok=True)

# Log file with timestamp
log_file = LOGS_DIR / f"nexusflow_{datetime.now().strftime('%Y%m%d')}.log"

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        # Log to file
        logging.FileHandler(log_file, encoding='utf-8'),
        # Also log to console
        logging.StreamHandler()
    ]
)

# Create logger
logger = logging.getLogger(__name__)

# Suppress overly verbose logs
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

def get_logger(name: str) -> logging.Logger:
    """Get a logger with the given name"""
    return logging.getLogger(name)