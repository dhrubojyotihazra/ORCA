"""
INCOIS Data Tools Stub.
Provides functions to retrieve INCOIS ocean advisory, alert, and weather data.
"""

from typing import Dict, Any


def get_alert_data(lat: float, lon: float) -> Dict[str, Any]:
    """
    Retrieve INCOIS alert and ocean weather advisory data for given coordinates.
    
    Args:
        lat: Latitude float.
        lon: Longitude float.
        
    Returns:
        Dictionary containing wave height, wind speed, alert level, and hazard status.
    """
    # Stub realistic response for testing weather agent logic
    return {
        "latitude": lat,
        "longitude": lon,
        "wave_height_m": 1.4,
        "wind_speed_knots": 12.0,
        "alert_level": "YELLOW",
        "hazard_type": "High Swell Waves Alert",
        "status": "MODERATE",
        "advisory": "Swell waves of height 1.4m expected along the coast. Exercise caution."
    }
