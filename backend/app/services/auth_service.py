import uuid
import logging
from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from app.services.supabase_client import get_supabase_client
from app.models.user import AuthTokenResponse

logger = logging.getLogger(__name__)

class AuthService:
    @staticmethod
    async def signup(email: str, password: str, display_name: Optional[str] = None) -> AuthTokenResponse:
        client = get_supabase_client()
        if not client:
            # Fallback mock for local development without Supabase project
            mock_id = str(uuid.uuid4())
            return AuthTokenResponse(
                access_token=f"mock-jwt-token-{mock_id}",
                token_type="bearer",
                expires_in=3600,
                user_id=mock_id,
                email=email
            )
        
        try:
            res = client.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {"display_name": display_name} if display_name else {}
                }
            })
            if not res.user:
                raise HTTPException(status_code=400, detail="Signup failed.")
            
            token = res.session.access_token if res.session else f"token-pending-verification-{res.user.id}"
            return AuthTokenResponse(
                access_token=token,
                token_type="bearer",
                expires_in=res.session.expires_in if res.session else 3600,
                refresh_token=res.session.refresh_token if res.session else None,
                user_id=res.user.id,
                email=res.user.email
            )
        except Exception as e:
            logger.error(f"Auth signup error: {e}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    async def login(email: str, password: str) -> AuthTokenResponse:
        client = get_supabase_client()
        if not client:
            # Fallback mock
            mock_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, email))
            return AuthTokenResponse(
                access_token=f"mock-jwt-token-{mock_id}",
                token_type="bearer",
                expires_in=3600,
                user_id=mock_id,
                email=email
            )
            
        try:
            res = client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            if not res.session or not res.user:
                raise HTTPException(status_code=401, detail="Invalid credentials.")
            
            return AuthTokenResponse(
                access_token=res.session.access_token,
                token_type="bearer",
                expires_in=res.session.expires_in,
                refresh_token=res.session.refresh_token,
                user_id=res.user.id,
                email=res.user.email
            )
        except Exception as e:
            logger.error(f"Auth login error: {e}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    @staticmethod
    async def send_otp(phone: str) -> Dict[str, Any]:
        client = get_supabase_client()
        if not client:
            return {"status": "success", "message": f"Mock OTP sent to {phone}. Use code 123456"}
            
        try:
            res = client.auth.sign_in_with_otp({"phone": phone})
            return {"status": "success", "message": f"OTP sent to {phone}"}
        except Exception as e:
            logger.error(f"Send OTP error: {e}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    async def verify_otp(phone: str, token: str) -> AuthTokenResponse:
        client = get_supabase_client()
        if not client:
            if token == "123456" or token.isdigit():
                mock_id = str(uuid.uuid5(uuid.NAMESPACE_OID, phone))
                return AuthTokenResponse(
                    access_token=f"mock-otp-jwt-{mock_id}",
                    token_type="bearer",
                    expires_in=3600,
                    user_id=mock_id
                )
            raise HTTPException(status_code=400, detail="Invalid OTP code.")
            
        try:
            res = client.auth.verify_otp({
                "phone": phone,
                "token": token,
                "type": "sms"
            })
            if not res.session or not res.user:
                raise HTTPException(status_code=400, detail="Invalid or expired OTP.")
                
            return AuthTokenResponse(
                access_token=res.session.access_token,
                token_type="bearer",
                expires_in=res.session.expires_in,
                refresh_token=res.session.refresh_token,
                user_id=res.user.id
            )
        except Exception as e:
            logger.error(f"Verify OTP error: {e}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    @staticmethod
    async def get_google_auth_url() -> Dict[str, str]:
        client = get_supabase_client()
        if not client:
            return {"url": "https://accounts.google.com/o/oauth2/auth?mock=true"}
            
        try:
            res = client.auth.get_url_for_provider("google", {"redirect_to": "http://localhost:3000/auth/callback"})
            return {"url": res.url}
        except Exception as e:
            logger.error(f"Google auth URL error: {e}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
