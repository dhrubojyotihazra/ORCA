import logging
from typing import Dict, Any, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    if not credentials:
        # Development fallback mode if unauthenticated
        return {
            "id": "00000000-0000-0000-0000-000000000000",
            "email": "dev@orca.ocean",
            "is_anonymous": False
        }
    
    token = credentials.credentials
    
    # Handle mock tokens in development
    if token.startswith("mock-"):
        user_id = token.replace("mock-jwt-token-", "").replace("mock-otp-jwt-", "")
        return {
            "id": user_id if len(user_id) == 36 else "00000000-0000-0000-0000-000000000000",
            "email": "dev@orca.ocean",
            "is_anonymous": False
        }

    client = get_supabase_client()
    if not client:
        # Fallback if Supabase not initialized
        return {
            "id": "00000000-0000-0000-0000-000000000000",
            "email": "dev@orca.ocean",
            "is_anonymous": False
        }

    try:
        user_response = client.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token."
            )
        return {
            "id": user_response.user.id,
            "email": user_response.user.email,
            "user_metadata": user_response.user.user_metadata
        }
    except Exception as e:
        logger.error(f"JWT verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials."
        )
