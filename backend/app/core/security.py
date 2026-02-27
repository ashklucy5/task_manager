from datetime import datetime, timedelta, timezone
from typing import Optional, Dict
import bcrypt
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password using bcrypt directly"""
    try:
        password_bytes = plain_password.encode('utf-8')[:72]  # Truncate to 72 bytes
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt directly (handles 72-byte limit)"""
    # Truncate to 72 bytes before hashing (bcrypt limit)
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def create_access_token(data: Dict[str, str], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token with UTC timezone awareness"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, str]]:
    """Decode and validate a JWT access token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None