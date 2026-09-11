import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import UserProfileResponse, UserProfileUpdate, OnboardingRequest
from app.dependencies import get_current_user
from app.services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/user", tags=["User Profile"])

# In-memory store fallback when Supabase is not connected
_mock_profiles: Dict[str, Dict[str, Any]] = {}

@router.get("/profile", response_model=UserProfileResponse)
async def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get current user's profile"""
    user_id = current_user["id"]
    client = get_supabase_client()

    if client:
        try:
            res = client.table("profiles").select("*").eq("id", user_id).execute()
            if res.data and len(res.data) > 0:
                p = res.data[0]
                # Parse PostGIS point if returned
                lat, lon = None, None
                return UserProfileResponse(
                    id=p["id"],
                    display_name=p.get("display_name"),
                    language=p.get("language", "en"),
                    latitude=lat,
                    longitude=lon,
                    location_name=p.get("location_name"),
                    vessel_type=p.get("vessel_type"),
                    created_at=p.get("created_at"),
                    updated_at=p.get("updated_at")
                )
        except Exception as e:
            logger.error(f"Error fetching profile from Supabase: {e}")

    # Fallback to mock store
    profile_data = _mock_profiles.get(user_id, {
        "id": user_id,
        "display_name": "Captain Fisher",
        "language": "en",
        "latitude": 20.9,
        "longitude": 70.37,
        "location_name": "Veraval Port",
        "vessel_type": "medium"
    })

    return UserProfileResponse(**profile_data)

@router.put("/profile", response_model=UserProfileResponse)
async def update_profile(
    body: UserProfileUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update profile fields"""
    user_id = current_user["id"]
    client = get_supabase_client()

    update_dict = {k: v for k, v in body.model_dump().items() if v is not None}
    
    if client:
        try:
            # Build PostGIS location string if lat/lon provided
            if "latitude" in update_dict and "longitude" in update_dict:
                lat = update_dict.pop("latitude")
                lon = update_dict.pop("longitude")
                update_dict["location"] = f"POINT({lon} {lat})"
            
            res = client.table("profiles").update(update_dict).eq("id", user_id).execute()
            if res.data and len(res.data) > 0:
                p = res.data[0]
                return UserProfileResponse(
                    id=p["id"],
                    display_name=p.get("display_name"),
                    language=p.get("language", "en"),
                    location_name=p.get("location_name"),
                    vessel_type=p.get("vessel_type")
                )
        except Exception as e:
            logger.error(f"Error updating profile in Supabase: {e}")

    # Update in mock store
    existing = _mock_profiles.get(user_id, {"id": user_id})
    existing.update(body.model_dump(exclude_unset=True))
    _mock_profiles[user_id] = existing
    return UserProfileResponse(**existing)

@router.post("/onboarding", response_model=UserProfileResponse, status_code=status.HTTP_201_CREATED)
async def onboarding(
    body: OnboardingRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create or update profile from 4-step onboarding flow"""
    user_id = current_user["id"]
    client = get_supabase_client()

    profile_payload = {
        "id": user_id,
        "display_name": body.display_name,
        "language": body.language,
        "location_name": body.location_name or "Home Port",
        "vessel_type": body.vessel_type,
        "latitude": body.latitude,
        "longitude": body.longitude
    }

    if client:
        try:
            supabase_payload = {
                "id": user_id,
                "display_name": body.display_name,
                "language": body.language,
                "location_name": body.location_name or "Home Port",
                "vessel_type": body.vessel_type,
                "location": f"POINT({body.longitude} {body.latitude})"
            }
            res = client.table("profiles").upsert(supabase_payload).execute()
            if res.data and len(res.data) > 0:
                p = res.data[0]
                return UserProfileResponse(
                    id=p["id"],
                    display_name=p.get("display_name"),
                    language=p.get("language", "en"),
                    latitude=body.latitude,
                    longitude=body.longitude,
                    location_name=p.get("location_name"),
                    vessel_type=p.get("vessel_type")
                )
        except Exception as e:
            logger.error(f"Error executing onboarding upsert in Supabase: {e}")

    # Save in mock store
    _mock_profiles[user_id] = profile_payload
    return UserProfileResponse(**profile_payload)
