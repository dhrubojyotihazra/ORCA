"""
MOSDAC Data Tools Stub.
Provides functions to retrieve ISRO MOSDAC satellite ocean observations
including Sea Surface Temperature (SST) and Chlorophyll-a concentration.
"""

from typing import Dict, Any, Optional


def get_sst(lat: float, lon: float, date: Optional[str] = None) -> Dict[str, Any]:
    """
    Retrieve MOSDAC Sea Surface Temperature (SST) satellite product.
    
    Args:
        lat: Latitude float.
        lon: Longitude float.
        date: Optional YYYY-MM-DD date string.
        
    Returns:
        Dictionary containing SST value in Celsius and metadata.
    """
    return {
        "latitude": lat,
        "longitude": lon,
        "date": date or "2026-09-07",
        "sst_celsius": 28.5,
        "quality_flag": "GOOD",
        "sensor": "ISRO Oceansat-3"
    }


def get_chlorophyll(lat: float, lon: float, date: Optional[str] = None) -> Dict[str, Any]:
    """
    Retrieve MOSDAC Chlorophyll-a concentration satellite product.
    
    Args:
        lat: Latitude float.
        lon: Longitude float.
        date: Optional YYYY-MM-DD date string.
        
    Returns:
        Dictionary containing chlorophyll-a value in mg/m3 and metadata.
    """
    return {
        "latitude": lat,
        "longitude": lon,
        "date": date or "2026-09-07",
        "chlorophyll_mg_m3": 1.25,
        "quality_flag": "GOOD",
        "sensor": "ISRO Oceansat-3 OCM"
    }
