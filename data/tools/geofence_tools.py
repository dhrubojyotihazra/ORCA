"""
Geofence Tools Stub.
Provides functions to check whether coordinates fall within Marine Protected Areas (MPA),
Restricted Naval Zones, International Maritime Boundary Lines (IMBL/EEZ), or Safe Open Water.
"""

from typing import Dict, Any


def check_geofence(lat: float, lon: float) -> Dict[str, Any]:
    """
    Check geofence dataset for given coordinates.
    
    Args:
        lat: Latitude float.
        lon: Longitude float.
        
    Returns:
        Dictionary containing geofence_status ('CLEAR' or 'RESTRICTED'),
        zone_type ('SAFE_OPEN_WATER', 'MPA', 'RESTRICTED_NAVAL_ZONE', 'IMBL_BOUNDARY'),
        zone_name, and advisory details.
    """
    # Simple deterministic rules for testing:
    # Special coordinates trigger specific test zones:
    # lat < 0 or lat > 25: RESTRICTED_NAVAL_ZONE
    # lat == 1.0, lon == 1.0: MPA
    # lat == 2.0, lon == 2.0: RESTRICTED_NAVAL_ZONE
    
    if lat == 1.0 and lon == 1.0:
        return {
            "latitude": lat,
            "longitude": lon,
            "geofence_status": "RESTRICTED",
            "zone_type": "MPA",
            "zone_name": "Marine Protected Coral Sanctuary",
            "is_restricted": True,
            "advisory": "Location is inside a protected marine sanctuary. Commercial fishing prohibited."
        }
    elif lat == 2.0 and lon == 2.0:
        return {
            "latitude": lat,
            "longitude": lon,
            "geofence_status": "RESTRICTED",
            "zone_type": "RESTRICTED_NAVAL_ZONE",
            "zone_name": "Naval Defense Sector B",
            "is_restricted": True,
            "advisory": "Location is inside a restricted defense operations zone. All civilian vessels prohibited."
        }
    elif lat == 3.0 and lon == 3.0:
        return {
            "latitude": lat,
            "longitude": lon,
            "geofence_status": "RESTRICTED",
            "zone_type": "IMBL_BOUNDARY",
            "zone_name": "International Maritime Boundary Line Sector",
            "is_restricted": True,
            "advisory": "Location is adjacent to international waters boundary. Risk of boundary crossing."
        }
    else:
        return {
            "latitude": lat,
            "longitude": lon,
            "geofence_status": "CLEAR",
            "zone_type": "SAFE_OPEN_WATER",
            "zone_name": "Arabian Sea Territorial EEZ",
            "is_restricted": False,
            "advisory": "Open Indian EEZ waters. Standard fishing permitted."
        }
