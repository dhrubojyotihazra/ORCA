import logging
from typing import Optional
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger(__name__)

_supabase_client: Optional[Client] = None
_supabase_admin_client: Optional[Client] = None

def get_supabase_client() -> Optional[Client]:
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client
    
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_ANON_KEY
    
    if not url or url.startswith("https://ORKA_PROJECT1.supabase.co") or not key or key.startswith("your-"):
        logger.warning("Supabase URL/Key not configured or placeholder detected. Client operating in fallback mode.")
        return None

    try:
        _supabase_client = create_client(url, key)
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None

def get_supabase_admin_client() -> Optional[Client]:
    global _supabase_admin_client
    if _supabase_admin_client is not None:
        return _supabase_admin_client

    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY

    if not url or url.startswith("https://your-project") or not key or key.startswith("your-"):
        logger.warning("Supabase Admin Key not configured. Operating in fallback mode.")
        return None

    try:
        _supabase_admin_client = create_client(url, key)
        return _supabase_admin_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase Admin client: {e}")
        return None
