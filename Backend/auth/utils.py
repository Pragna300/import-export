from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
from starlette.concurrency import run_in_threadpool
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", "your-refresh-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

async def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using direct bcrypt."""
    try:
        if isinstance(hashed_password, str):
            hashed_password = hashed_password.encode('utf-8')
        
        return await run_in_threadpool(
            bcrypt.checkpw, 
            plain_password.encode('utf-8'), 
            hashed_password
        )
    except Exception:
        return False

async def get_password_hash(password: str) -> str:
    """Hash a password using direct bcrypt with the 72-byte limit handled."""
    # Bcrypt has a hard 72-byte limit. 
    pw_bytes = password.encode('utf-8')
    if len(pw_bytes) > 71:
        # Safely truncate to 71 bytes
        pw_bytes = pw_bytes[:71]
    
    # Generate salt and hash
    salt = await run_in_threadpool(bcrypt.gensalt)
    hashed = await run_in_threadpool(bcrypt.hashpw, pw_bytes, salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta | int | None = None):
    """Create short-lived access token"""
    to_encode = data.copy()
    if isinstance(expires_delta, int):
        expires_delta = timedelta(minutes=expires_delta)
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    if "type" not in to_encode:
        to_encode.update({"type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_access_token(token: str):
    """Verify access token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def create_refresh_token(data: dict, expires_delta: timedelta | None = None):
    """Create long-lived refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)

def verify_refresh_token(token: str):
    """Verify refresh token"""
    try:
        payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None
