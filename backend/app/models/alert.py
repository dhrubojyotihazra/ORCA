from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime

SeverityType = Literal["red", "amber", "info"]

class AlertResponse(BaseModel):
    id: str
    severity: SeverityType
    title: str
    description: str
    source: str
    affected_area_geojson: Optional[Dict[str, Any]] = None
    distance_km: Optional[float] = None
    expires_at: Optional[datetime] = None
    created_at: datetime

class GeofenceCheckRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)

class ZoneViolation(BaseModel):
    zone_id: str
    zone_name: str
    zone_type: str  # e.g. "MPA", "IMBL", "RESTRICTED"
    message: str
    distance_to_boundary_m: Optional[float] = None

class GeofenceCheckResponse(BaseModel):
    in_restricted_zone: bool
    violations: List[ZoneViolation] = []
