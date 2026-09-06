import datetime
import requests
import json
import os
from functools import lru_cache

# Configuration for MOSDAC API (Placeholder)
# Note: You need to set these variables via environment variables or a .env file.
# Never commit real credentials!
MOSDAC_API_BASE = os.environ.get("MOSDAC_API_BASE", "https://mosdac.gov.in/api/v1")
MOSDAC_API_KEY = os.environ.get("MOSDAC_API_KEY", "your_api_key_here")

@lru_cache(maxsize=128)
def get_sst(lat: float, lon: float, target_date: datetime.date) -> dict:
    """
    Fetches Sea Surface Temperature (SST) for a given location and date from MOSDAC.

    Args:
        lat (float): Latitude of the target location.
        lon (float): Longitude of the target location.
        target_date (datetime.date): The date for which SST is required.

    Returns:
        dict: A dictionary containing the fetched SST data, e.g., {'sst': 29.5, 'unit': 'Celsius'}
    """
    # TODO: Implement the actual API request to MOSDAC based on their Data Download API docs.
    # This is a scaffolded response. Replace with real API logic.
    print(f"Fetching SST from MOSDAC for lat={lat}, lon={lon}, date={target_date}")
    
    # Placeholder implementation
    return {
        "status": "success",
        "data": {
            "lat": lat,
            "lon": lon,
            "date": target_date.isoformat(),
            "sst": 29.5,
            "unit": "Celsius",
            "source": "MOSDAC"
        }
    }


@lru_cache(maxsize=128)
def get_chlorophyll(lat: float, lon: float, target_date: datetime.date) -> dict:
    """
    Fetches Chlorophyll concentration for a given location and date from MOSDAC.

    Args:
        lat (float): Latitude of the target location.
        lon (float): Longitude of the target location.
        target_date (datetime.date): The date for which Chlorophyll is required.

    Returns:
        dict: A dictionary containing the fetched Chlorophyll data, e.g., {'chlorophyll': 1.2, 'unit': 'mg/m^3'}
    """
    # TODO: Implement the actual API request to MOSDAC.
    # This is a scaffolded response. Replace with real API logic.
    print(f"Fetching Chlorophyll from MOSDAC for lat={lat}, lon={lon}, date={target_date}")
    
    # Placeholder implementation
    return {
        "status": "success",
        "data": {
            "lat": lat,
            "lon": lon,
            "date": target_date.isoformat(),
            "chlorophyll": 1.2,
            "unit": "mg/m^3",
            "source": "MOSDAC"
        }
    }


@lru_cache(maxsize=128)
def get_ocean_current(lat: float, lon: float, target_date: datetime.date) -> dict:
    """
    Fetches ocean current speed and direction for a given location and date from MOSDAC.

    Args:
        lat (float): Latitude of the target location.
        lon (float): Longitude of the target location.
        target_date (datetime.date): The date for which ocean current is required.

    Returns:
        dict: A dictionary containing the fetched current data.
    """
    # TODO: Implement the actual API request to MOSDAC.
    print(f"Fetching Ocean Current from MOSDAC for lat={lat}, lon={lon}, date={target_date}")
    
    # Placeholder implementation
    return {
        "status": "success",
        "data": {
            "lat": lat,
            "lon": lon,
            "date": target_date.isoformat(),
            "speed": 0.5,
            "speed_unit": "m/s",
            "direction": 120,
            "direction_unit": "degrees",
            "source": "MOSDAC"
        }
    }
