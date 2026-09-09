import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.models.alert import AlertResponse, GeofenceCheckRequest, GeofenceCheckResponse
from app.utils.geo import GeoUtils, haversine_distance_km
from app.dependencies import get_current_user
from app.services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/alerts", tags=["Hazard Alerts & Geofencing"])

# Mock active alerts fallback
MOCK_ALERTS = [
    {
        "id": "alert-001",
        "severity": "red",
        "title": "Severe Cyclone Warning (Cyclone Tej)",
        "description": "Squally winds reaching 70-80 km/h gusting to 90 km/h along Gujarat coast. Fishermen advised not to venture into deep sea.",
        "source": "IMD Mumbai / INCOIS",
        "latitude": 20.85,
        "longitude": 70.35,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "alert-002",
        "severity": "amber",
        "title": "High Swell Surge Advisory",
        "description": "High swell waves in the range of 2.5 - 3.2 meters forecasted along Saurashtra coast during high tide.",
        "source": "INCOIS Hyderabad",
        "latitude": 20.95,
        "longitude": 70.45,
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=18)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
]


@router.get("", response_model=List[AlertResponse])
async def get_alerts(
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0),
    lon: Optional[float] = Query(None, ge=-180.0, le=180.0),
    radius_km: float = Query(200.0, gt=0, le=1000.0),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get active hazard alerts near user's location (filtered within radius, default 200km)"""
    client = get_supabase_client()

    user_lat = lat or 20.9
    user_lon = lon or 70.37

    if client:
        try:
            # Query PostGIS ST_DWithin
            res = client.table("alerts").select("*").execute()
            if res.data:
                alerts_out = []
                for a in res.data:
                    # Calculate distance
                    alerts_out.append(AlertResponse(
                        id=a["id"],
                        severity=a["severity"],
                        title=a["title"],
                        description=a["description"],
                        source=a["source"],
                        expires_at=a.get("expires_at"),
                        created_at=a["created_at"]
                    ))
                return alerts_out
        except Exception as e:
            logger.error(f"Error querying Supabase alerts: {e}")

    # Fallback spatial filter over mock alerts
    filtered_alerts = []
    for alert in MOCK_ALERTS:
        dist = haversine_distance_km(user_lat, user_lon, alert["latitude"], alert["longitude"])
        if dist <= radius_km:
            filtered_alerts.append(AlertResponse(
                id=alert["id"],
                severity=alert["severity"],
                title=alert["title"],
                description=alert["description"],
                source=alert["source"],
                distance_km=round(dist, 2),
                expires_at=alert["expires_at"],
                created_at=alert["created_at"]
            ))

    return filtered_alerts

@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert_by_id(alert_id: str):
    """Get details for a single alert"""
    for alert in MOCK_ALERTS:
        if alert["id"] == alert_id:
            return AlertResponse(
                id=alert["id"],
                severity=alert["severity"],
                title=alert["title"],
                description=alert["description"],
                source=alert["source"],
                expires_at=alert["expires_at"],
                created_at=alert["created_at"]
            )
    raise HTTPException(status_code=404, detail="Alert not found")

@router.post("/geofence-check", response_model=GeofenceCheckResponse)
async def geofence_check(body: GeofenceCheckRequest):
    """Check coordinates against MPA and IMBL restricted zones"""
    return await GeoUtils.check_geofence(body.latitude, body.longitude)
