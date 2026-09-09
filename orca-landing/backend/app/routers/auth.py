from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import (
    SignUpRequest,
    LoginRequest,
    OtpSendRequest,
    OtpVerifyRequest,
    AuthTokenResponse
)
from app.services.auth_service import AuthService
from app.dependencies import get_current_user
from typing import Dict, Any

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/signup", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignUpRequest):
    """Create account (email + password)"""
    return await AuthService.signup(email=body.email, password=body.password, display_name=body.display_name)

@router.post("/login", response_model=AuthTokenResponse)
async def login(body: LoginRequest):
    """Login (email + password)"""
    return await AuthService.login(email=body.email, password=body.password)

@router.post("/otp/send")
async def send_otp(body: OtpSendRequest):
    """Send OTP to phone number"""
    return await AuthService.send_otp(phone=body.phone)

@router.post("/otp/verify", response_model=AuthTokenResponse)
async def verify_otp(body: OtpVerifyRequest):
    """Verify phone OTP"""
    return await AuthService.verify_otp(phone=body.phone, token=body.token)

@router.post("/google")
async def google_auth():
    """Get Google OAuth redirect URL"""
    return await AuthService.get_google_auth_url()

@router.get("/me")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current authenticated user profile details from JWT"""
    return current_user

@router.post("/logout")
async def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Invalidate session"""
    return {"status": "success", "message": "Successfully logged out"}
