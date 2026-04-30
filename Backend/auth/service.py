from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
from . import schemas, utils
from models.models import User
from logger import log
from sqlalchemy import update
from google.oauth2 import id_token
from google.auth.transport import requests
import os


GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


async def authenticate_user(db: AsyncSession, email: str, password: str):
    """Authenticate user asynchronously"""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    
    if not user:
        return None
    
    # ✅ DOMAIN ENFORCEMENT: Only @shnoor.com allowed to log in
    if not email.lower().endswith("@shnoor.com"):
        return None
    if not user.is_active:
        return None
    if not await utils.verify_password(password, user.password_hash):
        return None
    
    return user

async def get_user_by_email(db: AsyncSession, email: str):
    """Get user by email asynchronously"""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()

async def create_user(db: AsyncSession, user_data: schemas.UserCreate):
    """Create a new user asynchronously"""
    try:
        # ✅ DOMAIN ENFORCEMENT: Only @shnoor.com emails allowed
        if not user_data.email.lower().endswith("@shnoor.com"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied. Registration is restricted to employees with @shnoor.com email addresses."
            )

        # Hash the password
        hashed_password = await utils.get_password_hash(user_data.password)
        
        # Create user model instance
        db_user = User(
            name=user_data.name,
            email=user_data.email,
            password_hash=hashed_password,
            role=user_data.role,
            is_active=True
        )
        
        # Add to database
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        
        return db_user
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating user: {str(e)}"
        )

async def update_user_password(db: AsyncSession, user: User, new_password: str):
    """Update user password with simplified async logic to prevent hangs"""
    try:
        log.info(f"🔄 Updating password for: {user.email}")
        
        # Hash the new password
        hashed_password = await utils.get_password_hash(new_password)
        
        # Simple attribute update is usually safest for objects already in session
        user.password_hash = hashed_password
        
        # Explicitly add to session and commit
        db.add(user)
        await db.commit()
        
        log.info(f"✅ Password reset successful for {user.email}")
        return user
    except Exception as e:
        await db.rollback()
        log.error(f"❌ Password update failed for {user.email}: {str(e)}")
        raise e

async def verify_google_token(token: str):
    try:
        import asyncio
        print(f"🔍 Verifying Google Token with Client ID: {GOOGLE_CLIENT_ID[:10]}...")
        
        # Wrap the synchronous Google verification in a thread to avoid blocking the event loop
        idinfo = await asyncio.to_thread(
            id_token.verify_oauth2_token,
            token,
            requests.Request(),
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10
        )
        return idinfo
    except Exception as e:
        print(f"❌ Google Token Verification Failed: {str(e)}")
        return None