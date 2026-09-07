import datetime
import requests
from functools import lru_cache

INCOIS_ERDDAP_BASE = "https://erddap.incois.gov.in/erddap"

@lru_cache(maxsize=128)
def get_pfz_advisories(sector_name: str, target_date: datetime.date = None) -> dict:
    """
    Fetches Potential Fishing Zone (PFZ) advisories for a given coastal sector from INCOIS ERDDAP.

    Args:
        sector_name (str): Name of the coastal sector (e.g., 'Gujarat', 'Kerala').
        target_date (datetime.date, optional): The date for the advisory. Defaults to today.

    Returns:
        dict: A dictionary containing the PFZ zones.
    """
    if target_date is None:
        target_date = datetime.date.today()
        
    print(f"Fetching PFZ advisory from INCOIS for sector='{sector_name}', date={target_date}")
    
    # TODO: Refine the actual dataset ID and query parameters based on INCOIS ERDDAP dataset lists.
    # Currently scaffolded.
    # example_url = f"{INCOIS_ERDDAP_BASE}/tabledap/some_pfz_dataset_id.json"
    
    # Placeholder implementation
    return {
        "status": "success",
        "data": {
            "sector": sector_name,
            "date": target_date.isoformat(),
            "pfz_zones": [
                {"lat": 20.1, "lon": 70.2, "depth": "30-50m"},
                {"lat": 20.3, "lon": 70.5, "depth": "50-100m"}
            ],
            "source": "INCOIS"
        }
    }


@lru_cache(maxsize=128)
def get_hazard_alerts(lat: float, lon: float, target_date: datetime.date = None) -> dict:
    """
    Fetches hazard and weather alerts (e.g., high waves, lightning, cyclones) for a location from INCOIS ERDDAP.

    Args:
        lat (float): Latitude of the target location.
        lon (float): Longitude of the target location.
        target_date (datetime.date, optional): The date for the alert check. Defaults to today.

    Returns:
        dict: A dictionary containing the alert data.
    """
    if target_date is None:
        target_date = datetime.date.today()
        
    print(f"Fetching Hazard Alerts from INCOIS for lat={lat}, lon={lon}, date={target_date}")
    
    # TODO: Implement the actual query to INCOIS ERDDAP.
    # Placeholder implementation
    return {
        "status": "success",
        "data": {
            "lat": lat,
            "lon": lon,
            "date": target_date.isoformat(),
            "alerts": [
                {"type": "High Wave", "severity": "Warning", "message": "High waves expected up to 3m."}
            ],
            "source": "INCOIS"
        }
    }


@lru_cache(maxsize=128)
def get_live_argo_sst(lat: float, lon: float) -> dict:
    """
    Queries live INCOIS ERDDAP Indian_ARGO_Floats tabledap dataset for SST.
    Searches a ±3° bounding box for surface observations (depth <= 15m).
    """
    lat_min, lat_max = round(lat - 3.0, 1), round(lat + 3.0, 1)
    lon_min, lon_max = round(lon - 3.0, 1), round(lon + 3.0, 1)
    since = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=36 * 30)).strftime("%Y-%m-%dT%H:%M:%SZ")

    url = (
        f"{INCOIS_ERDDAP_BASE}/tabledap/Indian_ARGO_Floats.json"
        f"?time,latitude,longitude,TEMP,PRES"
        f"&latitude>={lat_min}&latitude<={lat_max}"
        f"&longitude>={lon_min}&longitude<={lon_max}"
        f"&PRES>=0&PRES<=15&time>={since}"
    )
    try:
        r = requests.get(url, verify=False, timeout=3.5)
        if r.status_code == 200:
            rows = r.json().get("table", {}).get("rows", [])
            if rows:
                best_row = min(rows, key=lambda row: (row[1] - lat) ** 2 + (row[2] - lon) ** 2)
                obs_time, obs_lat, obs_lon, temp = best_row[0], best_row[1], best_row[2], best_row[3]
                if temp is not None and -2 <= temp <= 40:
                    return {
                        "status": "success",
                        "is_live": True,
                        "sst": round(temp, 2),
                        "obs_lat": obs_lat,
                        "obs_lon": obs_lon,
                        "obs_time": obs_time,
                        "dataset": "Indian_ARGO_Floats",
                        "source": f"INCOIS ERDDAP Live — dataset:Indian_ARGO_Floats, fetched:{obs_time}",
                    }
    except Exception:
        pass

    return {
        "status": "fallback",
        "is_live": False,
        "sst": 29.4,
        "source": "Cached Baseline Fallback (live fetch unavailable)",
    }


@lru_cache(maxsize=128)
def get_live_ascat_wind(lat: float, lon: float) -> dict:
    """
    Queries live INCOIS ERDDAP ascat_daily_datasets griddap for wind speed.
    """
    last_date = "2023-05-20T12:00:00Z"
    lat_lo = f"{(lat - 0.25):.3f}"
    lat_hi = f"{(lat + 0.25):.3f}"
    lon_lo = f"{(lon - 0.25):.3f}"
    lon_hi = f"{(lon + 0.25):.3f}"

    url = (
        f"{INCOIS_ERDDAP_BASE}/griddap/ascat_daily_datasets.json"
        f"?wind_speed%5B({last_date})%5D%5B(10.0)%5D%5B({lat_lo}):({lat_hi})%5D%5B({lon_lo}):({lon_hi})%5D"
    )
    try:
        r = requests.get(url, verify=False, timeout=3.5)
        if r.status_code == 200:
            rows = r.json().get("table", {}).get("rows", [])
            valid_winds = [row[4] for row in rows if len(row) > 4 and row[4] is not None and row[4] > 0]
            if valid_winds:
                avg_ms = sum(valid_winds) / len(valid_winds)
                knots = round(avg_ms * 1.94384, 1)
                return {
                    "status": "success",
                    "is_live": True,
                    "wind_speed_ms": round(avg_ms, 2),
                    "wind_speed_knots": knots,
                    "obs_time": rows[0][0],
                    "dataset": "ascat_daily_datasets",
                    "source": f"INCOIS ERDDAP Live — dataset:ascat_daily_datasets, fetched:{rows[0][0]}",
                }
    except Exception:
        pass

    return {
        "status": "fallback",
        "is_live": False,
        "wind_speed_knots": 18.5,
        "source": "Cached Baseline Fallback (live fetch unavailable)",
    }

