from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
from . import schemas, utils
from models.models import User

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
    if not utils.verify_password(password, user.password_hash):
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
        hashed_password = utils.get_password_hash(user_data.password)
        
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
    """Update user password asynchronously"""
    user.password_hash = utils.get_password_hash(new_password)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
