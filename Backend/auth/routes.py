import os
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from . import schemas, service, utils
from .dependencies import get_db, get_current_user
from logger import log

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=schemas.Token)
async def login_for_access_token(
    response: Response,
    login_data: schemas.LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate user and return tokens with HTTP-only cookie for refresh token"""
    user = await service.authenticate_user(db, login_data.email, login_data.password)
    
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
        secure=False,       # Set to True in production with HTTPS
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
async def register_user(
    user_data: schemas.UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user asynchronously"""
    # Check if user already exists
    existing_user = await service.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = await service.create_user(db, user_data)
    
    return new_user

@router.post("/refresh")
async def refresh_access_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """Get new access token using refresh token from cookie asynchronously"""
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
    
    user = await service.get_user_by_email(db, user_email)
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
async def logout(response: Response):
    """Clear refresh token cookie"""
    response.delete_cookie(
        key="refresh_token",
        path="/auth/refresh"
    )
    return {"message": "Successfully logged out"}

@router.post("/login-json", response_model=schemas.Token)
async def login_json(
    login_data: schemas.LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """Alternative login that returns both tokens in JSON (no cookies) asynchronously"""
    user = await service.authenticate_user(db, login_data.email, login_data.password)
    
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

@router.post("/forgot-password")
async def forgot_password(
    request_data: schemas.ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """Simulate sending a password reset email by logging to terminal"""
    user = await service.get_user_by_email(db, request_data.email)
    if not user:
        # Don't reveal if user exists or not for security
        return {"message": "If an account with that email exists, a reset link has been sent."}
    
    # Create a reset token (expiring in 30 minutes)
    reset_token = utils.create_access_token(
        data={"sub": user.email, "type": "password_reset"},
        expires_delta=30 # 30 minutes
    )
    
    # Send real email in the background for faster response time
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"
    
    background_tasks.add_task(utils.send_reset_email, user.email, reset_link)
    
    return {"message": "If an account with that email exists, a reset link has been sent."}

@router.post("/reset-password")
async def reset_password(
    reset_data: schemas.ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """Reset user password using a valid token"""
    log.debug(f"🔑 Reset Password attempt with token start: {reset_data.token[:10]}...")
    
    payload = utils.verify_access_token(reset_data.token)
    if not payload or payload.get("type") != "password_reset":
        log.warning("❌ Invalid or expired reset token provided")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    email = payload.get("sub")
    log.debug(f"📧 Token valid for email: {email}")
    
    user = await service.get_user_by_email(db, email)
    if not user:
        log.warning(f"❓ User not found for email: {email}")
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    log.debug("📝 Calling service.update_user_password...")
    await service.update_user_password(db, user, reset_data.new_password)
    log.debug("✅ service.update_user_password completed")
    
    return {"message": "Password successfully reset. You can now login with your new password."}


@router.post("/google-login")
async def google_login(
    token_data: dict,
    db: AsyncSession = Depends(get_db)
):
    id_token_str = token_data.get("token")

    if not id_token_str:
        raise HTTPException(status_code=400, detail="Token missing")

    # Verify token
    google_user = await service.verify_google_token(id_token_str)

    if not google_user:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    email = google_user.get("email")
    name = google_user.get("name")

    # Optional: domain restriction
    if not email.endswith("@shnoor.com"):
        raise HTTPException(status_code=403, detail="Only company emails allowed")

    # Check if user exists
    user = await service.get_user_by_email(db, email)

    if not user:
        # Create user WITHOUT password
        user_data = schemas.UserCreate(
            name=name,
            email=email,
            password="google_oauth_dummy",  # not used
            role="user"
        )
        user = await service.create_user(db, user_data)

    # Generate tokens (reuse your system ✅)
    access_token = utils.create_access_token(
        data={"sub": user.email, "user_id": user.id}
    )
    refresh_token = utils.create_refresh_token(
        data={"sub": user.email, "user_id": user.id}
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }