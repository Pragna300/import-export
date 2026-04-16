from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from . import models, schemas, utils

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        return None
    if not user.is_active:
        return None
    if not utils.verify_password(password, user.password_hash):
        return None
    
    return user

def get_user_by_email(db: Session, email: str):
    """Get user by email"""
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user_data: schemas.UserCreate):
    """Create a new user"""
    try:
        # Hash the password
        hashed_password = utils.get_password_hash(user_data.password)
        
        # Create user model instance
        db_user = models.User(
            name=user_data.name,
            email=user_data.email,
            password_hash=hashed_password,
            role=user_data.role,
            is_active=True
        )
        
        # Add to database
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating user: {str(e)}"
        )