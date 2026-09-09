import math
import logging
from typing import List, Dict, Any, Optional
from app.models.alert import ZoneViolation, GeofenceCheckResponse
from app.services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

# Sample predefined zones for fallback geofence checking
PREDEFINED_ZONES = [
    {
        "zone_id": "zone-imbl-01",
        "zone_name": "India - Sri Lanka Maritime Boundary (IMBL)",
        "zone_type": "IMBL",
        "min_lat": 9.0, "max_lat": 10.5,
        "min_lon": 79.2, "max_lon": 80.5,
        "message": "WARNING: You are nearing or inside the International Maritime Boundary Line. Turn back to safe waters."
    },
    {
        "zone_id": "zone-mpa-01",
        "zone_name": "Gulf of Mannar Marine National Park",
        "zone_type": "MPA",
        "min_lat": 8.7, "max_lat": 9.3,
        "min_lon": 78.1, "max_lon": 79.3,
        "message": "RESTRICTED: You are inside a protected Marine National Park zone. Commercial trawling prohibited."
    }
]

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points in km."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def point_in_polygon(lat: float, lon: float, polygon: List[tuple[float, float]]) -> bool:
    """Ray casting algorithm to determine if point (lat, lon) is inside polygon [(lon, lat), ...]"""
    inside = False
    n = len(polygon)
    if n < 3:
        return False
    p1x, p1y = polygon[0]
    for i in range(n + 1):
        p2x, p2y = polygon[i % n]
        if lat > min(p1y, p2y):
            if lat <= max(p1y, p2y):
                if lon <= max(p1x, p2x):
                    if p1y != p2y:
                        xinters = (lat - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                    if p1x == p2x or lon <= xinters:
                        inside = not inside
        p1x, p1y = p2x, p2y
    return inside

def parse_wkt_polygon(wkt: str) -> List[tuple[float, float]]:
    """Parse 'POLYGON((lon1 lat1, lon2 lat2, ...))' into list of (lon, lat) tuples."""
    try:
        cleaned = wkt.replace("POLYGON", "").replace("((", "").replace("))", "").strip()
        coords = []
        for pair in cleaned.split(","):
            parts = pair.strip().split()
            if len(parts) >= 2:
                coords.append((float(parts[0]), float(parts[1])))
        return coords
    except Exception:
        return []

class GeoUtils:
    @staticmethod
    def validate_coordinates(lat: float, lon: float) -> bool:
        return -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0

    @staticmethod
    async def check_geofence(lat: float, lon: float) -> GeofenceCheckResponse:
        """Check if GPS coordinate is inside any restricted MPA or IMBL zone."""
        client = get_supabase_client()
        violations: List[ZoneViolation] = []

        if client:
            try:
                # 1. Try RPC check_point_geofence
                try:
                    res_rpc = client.rpc("check_point_geofence", {"p_lat": lat, "p_lon": lon}).execute()
                    if res_rpc.data and len(res_rpc.data) > 0:
                        for z in res_rpc.data:
                            violations.append(ZoneViolation(
                                zone_id=str(z["id"]),
                                zone_name=z["name"],
                                zone_type=z["zone_type"],
                                message=f"WARNING: Inside restricted zone: {z['name']} ({z['zone_type']})"
                            ))
                        return GeofenceCheckResponse(in_restricted_zone=True, violations=violations)
                except Exception:
                    pass

                # 2. Query seeded geofence_zones from Supabase
                res = client.table("geofence_zones").select("*").execute()
                if res.data and len(res.data) > 0:
                    for z in res.data:
                        boundary = z.get("boundary")
                        if boundary and isinstance(boundary, str) and boundary.startswith("POLYGON"):
                            poly_coords = parse_wkt_polygon(boundary)
                            if point_in_polygon(lat, lon, poly_coords):
                                violations.append(ZoneViolation(
                                    zone_id=str(z["id"]),
                                    zone_name=z["name"],
                                    zone_type=z["zone_type"],
                                    message=f"WARNING: Inside restricted boundary: {z['name']} ({z['zone_type']})"
                                ))
                    if violations:
                        return GeofenceCheckResponse(in_restricted_zone=True, violations=violations)
            except Exception as e:
                logger.error(f"Geofence Supabase evaluation error: {e}")

        # Fallback predefined bounding box check
        for zone in PREDEFINED_ZONES:
            if zone["min_lat"] <= lat <= zone["max_lat"] and zone["min_lon"] <= lon <= zone["max_lon"]:
                violations.append(ZoneViolation(
                    zone_id=zone["zone_id"],
                    zone_name=zone["zone_name"],
                    zone_type=zone["zone_type"],
                    message=zone["message"]
                ))

        return GeofenceCheckResponse(
            in_restricted_zone=len(violations) > 0,
            violations=violations
        )
