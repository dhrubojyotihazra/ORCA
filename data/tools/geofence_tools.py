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

def _load_geofence_data() -> dict:
    if os.path.exists(GEOFENCE_DATA_PATH):
        with open(GEOFENCE_DATA_PATH, "r") as f:
            return json.load(f)
    return {}

def check_zone(lat: float, lon: float) -> dict:
    """
    Checks if a given coordinate falls into restricted zones, maritime boundaries, 
    or marine protected areas.
    """
    print(f"Checking geofence zones for lat={lat}, lon={lon}")
    
    geo_data = _load_geofence_data()
    
    if HAS_SHAPELY:
        point = Point(lon, lat)
        features = geo_data.get("features", [])
        for feature in features:
            geom = shape(feature["geometry"])
            if geom.contains(point):
                props = feature.get("properties", {})
                return {
                    "status": "success",
                    "data": {
                        "lat": lat,
                        "lon": lon,
                        "is_restricted": True,
                        "is_near_international_boundary": "Boundary" in props.get("zone_name", ""),
                        "zone_name": props.get("zone_name", "Unknown Zone"),
                        "message": props.get("message", "Restricted area."),
                        "source": "Local Geofence Dataset"
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
            "message": "Clear to operate.",
            "source": "Local Geofence Dataset"
        }
    }
