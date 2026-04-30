from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError, jwt
from . import utils, service
from database import get_db
import os

security = HTTPBearer()

async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Get current user from access token in Authorization header OR Cookies"""
    token = None
    
    # 1. Check Authorization Header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    
    # 2. Check Cookies as fallback
    if not token:
        token = request.cookies.get("access_token")
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided",
        )
    
    try:
        payload = jwt.decode(
            token, 
            utils.SECRET_KEY, 
            algorithms=[utils.ALGORITHM]
        )
        user_email: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        
        if user_email is None or user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    user = await service.get_user_by_email(db, user_email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user
