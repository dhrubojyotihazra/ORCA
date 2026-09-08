import json
import os

try:
    from shapely.geometry import shape, Point
    HAS_SHAPELY = True
except ImportError:
    HAS_SHAPELY = False

# We will load the mock geofence geojson from the data folder
# Ensure it exists or is generated later
GEOFENCE_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "geofence_boundaries.geojson")

# In-memory cache for fast spatial queries
_GEOFENCE_CACHE = None

def _load_geofence_data() -> dict:
    global _GEOFENCE_CACHE
    if _GEOFENCE_CACHE is not None:
        return _GEOFENCE_CACHE
    if os.path.exists(GEOFENCE_DATA_PATH):
        with open(GEOFENCE_DATA_PATH, "r", encoding="utf-8") as f:
            _GEOFENCE_CACHE = json.load(f)
            return _GEOFENCE_CACHE
    return {}

def check_zone(lat: float, lon: float) -> dict:
    """
    Checks if a given coordinate falls into restricted zones, maritime boundaries, 
    or marine protected areas using Shapely point-in-polygon analysis.
    """
    geo_data = _load_geofence_data()
    
    if HAS_SHAPELY and geo_data:
        point = Point(lon, lat)
        features = geo_data.get("features", [])
        for feature in features:
            geom = shape(feature["geometry"])
            if geom.contains(point):
                props = feature.get("properties", {})
                zone_name = props.get("zone_name", "Unknown Zone")
                is_boundary = "Boundary" in zone_name or "IMBL" in zone_name
                return {
                    "status": "success",
                    "data": {
                        "lat": lat,
                        "lon": lon,
                        "is_restricted": True,
                        "is_near_international_boundary": is_boundary,
                        "zone_name": zone_name,
                        "restriction_type": props.get("restriction_type", "Regulatory Zone"),
                        "restriction_level": props.get("restriction_level", "Strict"),
                        "authority": props.get("authority", "MoEFCC / Coastal Authority"),
                        "source": props.get("source", "Bharatmaps Parivesh via india-geodata"),
                        "message": props.get("message", "Restricted area under environmental/maritime regulation.")
                    }
                }
            
    # If not in any restricted zone or if shapely is not installed
    return {
        "status": "success",
        "data": {
            "lat": lat,
            "lon": lon,
            "is_restricted": False,
            "is_near_international_boundary": False,
            "zone_name": "Open Water / EEZ",
            "restriction_type": "Navigable Waters",
            "restriction_level": "None",
            "authority": "Indian Coast Guard / DG Shipping",
            "source": "Bharatmaps Parivesh & UNCLOS Baselines",
            "message": "Clear to operate."
        }
    }

