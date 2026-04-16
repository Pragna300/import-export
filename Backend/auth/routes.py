from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from . import schemas, service, utils
from .dependencies import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(
    response: Response,
    login_data: schemas.LoginRequest,
    db: Session = Depends(get_db)
):
    user = service.authenticate_user(db, login_data.email, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create tokens
    access_token = utils.create_access_token(
        data={"sub": user.email, "user_id": user.id}
    )
    refresh_token = utils.create_refresh_token(
        data={"sub": user.email, "user_id": user.id}
    )
    
    # Set refresh token as HTTP-only cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,      
        secure=False,       
        samesite="lax",     
        max_age=7 * 24 * 60 * 60,  
        path="/auth/refresh"  
    )
    
    return schemas.Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    # Check if user already exists
    existing_user = service.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = service.create_user(db, user_data)
    
    return new_user

@router.post("/refresh")
def refresh_access_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Get new access token using refresh token from cookie"""
    # Get refresh token from cookie
    refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing"
        )
    
    # Verify refresh token
    payload = utils.verify_refresh_token(refresh_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Get user from database
    user_email = payload.get("sub")
    user_id = payload.get("user_id")
    
    if not user_email or not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    user = service.get_user_by_email(db, user_email)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Create new access token
    new_access_token = utils.create_access_token(
        data={"sub": user.email, "user_id": user.id}
    )
    
    return {"access_token": new_access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(response: Response):
    """Clear refresh token cookie"""
    response.delete_cookie(
        key="refresh_token",
        path="/auth/refresh"
    )
    return {"message": "Successfully logged out"}

# Your existing login route if you want to keep it without cookies
@router.post("/login-json", response_model=schemas.Token)
def login_json(
    login_data: schemas.LoginRequest,
    db: Session = Depends(get_db)
):
    """Alternative login that returns both tokens in JSON (no cookies)"""
    user = service.authenticate_user(db, login_data.email, login_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    access_token = utils.create_access_token(
        data={"sub": user.email, "user_id": user.id}
    )
    refresh_token = utils.create_refresh_token(
        data={"sub": user.email, "user_id": user.id}
    )
    
    return schemas.Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )