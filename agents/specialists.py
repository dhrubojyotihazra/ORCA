import math
import datetime
from typing import Dict, Any, List
from .state import AgentState, OceanTelemetry, WeatherTelemetry, RiskAssessment
from data.tools.incois_tools import get_live_argo_sst, get_live_ascat_wind, get_live_openmeteo_wave
from data.tools.geofence_tools import check_zone


def calculate_distance_nm(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates Great-Circle Distance in Nautical Miles (NM)."""
    to_rad = lambda d: d * math.pi / 180.0
    r = 3440.065  # Earth radius in NM
    d_lat = to_rad(lat2 - lat1)
    d_lon = to_rad(lon2 - lon1)
    a = (
        math.sin(d_lat / 2.0) ** 2
        + math.cos(to_rad(lat1)) * math.cos(to_rad(lat2)) * math.sin(d_lon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(r * c, 1)


def calculate_hsi(sst: float, chl: float, target_sst: tuple, target_chl: tuple) -> float:
    """Calculates Gaussian-like Habitat Suitability Index (0.0 to 1.0)."""
    min_s, max_s = target_sst
    min_c, max_c = target_chl
    
    # Temperature suitability
    if min_s <= sst <= max_s:
        s_score = 1.0
    else:
        dist = min(abs(sst - min_s), abs(sst - max_s))
        s_score = max(0.0, 1.0 - (dist / 3.0))
        
    # Chlorophyll suitability
    if min_c <= chl <= max_c:
        c_score = 1.0
    else:
        dist = min(abs(chl - min_c), abs(chl - max_c))
        c_score = max(0.0, 1.0 - (dist / 1.5))
        
    return round(0.6 * s_score + 0.4 * c_score, 2)


# Port environmental registry
PORT_ENV_DEFAULTS = {
    "paradip": {"sst": 29.4, "chl": 1.82, "hs": 2.1, "wind": 18.5, "mpa_name": "Gahirmatha Marine Sanctuary", "mpa": (20.65, 87.05), "imbl": (20.50, 88.50)},
    "haldia": {"sst": 28.8, "chl": 2.45, "hs": 1.8, "wind": 16.0, "mpa_name": "Sundarbans Biosphere Reserve", "mpa": (21.80, 88.50), "imbl": (21.20, 89.10)},
    "digha": {"sst": 29.1, "chl": 2.10, "hs": 2.0, "wind": 17.2, "mpa_name": "Gahirmatha Buffer Zone", "mpa": (20.70, 87.10), "imbl": (20.90, 88.80)},
    "visakhapatnam": {"sst": 29.8, "chl": 0.95, "hs": 1.5, "wind": 13.5, "mpa_name": "Coringa Wildlife Sanctuary", "mpa": (16.85, 82.30), "imbl": (18.20, 87.50)},
    "chennai": {"sst": 30.1, "chl": 0.85, "hs": 1.6, "wind": 14.0, "mpa_name": "Gulf of Mannar Biosphere", "mpa": (9.20, 79.15), "imbl": (10.05, 79.85)},
    "mumbai": {"sst": 28.5, "chl": 1.65, "hs": 1.4, "wind": 12.0, "mpa_name": "Malvan Marine Sanctuary", "mpa": (16.05, 73.45), "imbl": (19.20, 68.00)},
    "kochi": {"sst": 28.9, "chl": 1.45, "hs": 1.3, "wind": 11.5, "mpa_name": "Vembanad Marine Eco-Zone", "mpa": (9.60, 76.35), "imbl": (8.50, 75.00)},
}


def ocean_specialist_node(state: AgentState) -> Dict[str, Any]:
    """
    Ocean Specialist Node:
    Queries live INCOIS ARGO SST and computes Species Habitat Suitability Index (HSI).
    """
    loc = state.get("location") or {"lat": 20.26, "lon": 86.67, "name": "Paradip Harbour"}
    lat = loc.get("lat", 20.26)
    lon = loc.get("lon", 86.67)
    port_key = loc.get("name", "paradip").lower()
    
    defaults = PORT_ENV_DEFAULTS.get("paradip")
    for k, v in PORT_ENV_DEFAULTS.items():
        if k in port_key:
            defaults = v
            break
            
    # Attempt live ARGO query
    live_argo = get_live_argo_sst(lat, lon)
    if live_argo.get("is_live"):
        sst = live_argo["sst"]
        sst_source = live_argo["source"]
        obs_time = live_argo["obs_time"]
    else:
        sst = defaults["sst"]
        sst_source = "Cached Baseline Fallback (live fetch unavailable)"
        obs_time = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    sst_anomaly = 0.8
    chlorophyll = defaults["chl"]
    
    # Compute species-specific HSI (Yellowfin Tuna, Indian Mackerel, Hilsa)
    hsi_tuna = calculate_hsi(sst, chlorophyll, (27.0, 29.0), (0.15, 0.35))
    hsi_mackerel = calculate_hsi(sst, chlorophyll, (26.0, 28.5), (0.40, 1.20))
    hsi_hilsa = calculate_hsi(sst, chlorophyll, (27.5, 30.0), (1.50, 3.50))
    
    ocean_payload: OceanTelemetry = {
        "sst_celsius": sst,
        "sst_anomaly": sst_anomaly,
        "chlorophyll_a": chlorophyll,
        "thermal_front": True,
        "species_hsi": {
            "Yellowfin Tuna": hsi_tuna,
            "Indian Mackerel": hsi_mackerel,
            "Hilsa / Pelagics": hsi_hilsa,
        },
        "pfz_coordinates": [
            {"lat": round(lat - 0.28, 2), "lon": round(lon + 0.35, 2)},
            {"lat": round(lat - 0.15, 2), "lon": round(lon + 0.55, 2)},
        ],
        "source": sst_source,
        "chlorophyll_source": "INCOIS Regional Climatology Baseline (seasonal composite)",
        "pfz_source": "Bathymetric Shelf-Break Model (Illustrative offset; not live INCOIS PFZ bulletin)",
        "timestamp": obs_time,
    }
    
    return {
        "ocean_data": ocean_payload,
        "evidence_citations": [
            f"Ocean Specialist: SST={sst}°C ({sst_source}) | Chl-a={chlorophyll} mg/m³ (INCOIS Climatology Baseline) | PFZ Coordinates: Bathymetric Model (Illustrative) | HSI(Mackerel)={hsi_mackerel}"
        ],
    }


def weather_specialist_node(state: AgentState) -> Dict[str, Any]:
    """
    Weather Specialist Node:
    Queries live INCOIS ASCAT wind speed and correlates with Wave Forecasts.
    """
    loc = state.get("location") or {"lat": 20.26, "lon": 86.67, "name": "Paradip"}
    lat = loc.get("lat", 20.26)
    lon = loc.get("lon", 86.67)
    port_key = loc.get("name", "paradip").lower()
    
    defaults = PORT_ENV_DEFAULTS.get("paradip")
    for k, v in PORT_ENV_DEFAULTS.items():
        if k in port_key:
            defaults = v
            break
            
    # Attempt live ASCAT wind query
    live_ascat = get_live_ascat_wind(lat, lon)
    if live_ascat.get("is_live"):
        wind_speed = live_ascat["wind_speed_knots"]
        weather_source = live_ascat["source"]
        obs_time = live_ascat["obs_time"]
    else:
        wind_speed = defaults["wind"]
        weather_source = "Cached Baseline Fallback (live fetch unavailable)"
        obs_time = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    # Attempt live Open-Meteo wave query (live-first, baseline-second)
    live_wave = get_live_openmeteo_wave(lat, lon)
    if live_wave.get("is_live"):
        hs = live_wave["wave_height_m"]
        wave_period = live_wave["wave_period_s"]
        wave_dir = live_wave["wave_direction_deg"]
        wave_source = live_wave["source"]
    else:
        hs = defaults["hs"]
        wave_period = 8.4
        wave_dir = 195.0
        wave_source = "INCOIS High-Resolution Wave Model (OSF Baseline Registry)"

    squall_prob = 12.0
    cyclone_level = "Amber (Advisory)"
    
    weather_payload: WeatherTelemetry = {
        "significant_wave_height_m": hs,
        "wave_period_s": wave_period,
        "wind_speed_knots": wind_speed,
        "wind_direction_deg": wave_dir,
        "lightning_squall_prob_pct": squall_prob,
        "cyclone_alert_level": cyclone_level,
        "source": weather_source,
        "wave_source": wave_source,
        "squall_source": "IMD Regional Climatology Baseline (Historical Squall Frequency)",
        "cyclone_source": "State Disaster Management Seasonal Stage (Simulated Baseline Advisory)",
        "timestamp": obs_time,
    }
    
    return {
        "weather_data": weather_payload,
        "evidence_citations": [
            f"Weather Specialist: Hs={hs}m ({wave_source}) | Wind={wind_speed} kts ({weather_source}) | Squall={squall_prob}% (Climatology Baseline) | Cyclone Stage={cyclone_level} (Seasonal Baseline)"
        ],
    }


def risk_specialist_node(state: AgentState) -> Dict[str, Any]:
    """
    Risk Specialist Node:
    Computes Sea-Venture Safety Index (0-100) ONLY when weather_data is present in state.
    If weather_data is absent, omits the safety index and reports only geofence boundaries.
    """
    loc = state.get("location") or {"lat": 20.26, "lon": 86.67, "name": "Paradip"}
    lat = loc.get("lat", 20.26)
    lon = loc.get("lon", 86.67)
    vessel = (state.get("vessel_type") or "small").lower().strip()
    weather = state.get("weather_data")

    vessel_brackets = {
        "small": "<8m",
        "medium": "8-15m",
        "large": ">15m",
    }
    vessel_bracket = vessel_brackets.get(vessel, "<8m")
    vessel_names = {
        "small": "Small Artisanal Craft",
        "medium": "Motorized Craft",
        "large": "Deep-Sea Trawler",
    }
    vessel_name = vessel_names.get(vessel, "Small Artisanal Craft")
    
    defaults = PORT_ENV_DEFAULTS.get("paradip")
    for k, v in PORT_ENV_DEFAULTS.items():
        if k in loc.get("name", "paradip").lower():
            defaults = v
            break

    # Real Haversine geofence calculations
    mpa_coord = defaults["mpa"]
    imbl_coord = defaults["imbl"]
    mpa_distance = calculate_distance_nm(lat, lon, mpa_coord[0], mpa_coord[1])
    imbl_distance = calculate_distance_nm(lat, lon, imbl_coord[0], imbl_coord[1])
    
    # Check Shapely polygon zone (Bharatmaps Parivesh & UNCLOS datasets)
    zone_check = check_zone(lat, lon)
    zd = zone_check.get("data", {})
    is_in_restricted_zone = zd.get("is_restricted", False)
    zone_name = zd.get("zone_name", "Open Water / EEZ")
    zone_restr_type = zd.get("restriction_type", "")
    zone_auth = zd.get("authority", "")
    zone_msg = zd.get("message", "")
    zone_src = zd.get("source", "")

    has_weather = bool(weather and "wind_speed_knots" in weather)

    if has_weather:
        hs = weather.get("significant_wave_height_m", defaults["hs"])
        w = weather["wind_speed_knots"]
        l = weather.get("lightning_squall_prob_pct", 12.0)
        
        # Weight selection based on vessel displacement
        if vessel == "large":
            w1, w2, w3 = 7.0, 0.6, 0.5
            penalty = 15.0 if hs > 4.0 else 0.0
            penalty_rule = "15.0 if Hs > 4.0m"
        elif vessel == "medium":
            w1, w2, w3 = 12.0, 0.9, 0.7
            penalty = 10.0 if hs > 2.8 else 0.0
            penalty_rule = "10.0 if Hs > 2.8m"
        else:  # Small craft (<8m)
            w1, w2, w3 = 18.5, 1.2, 0.8
            penalty = 25.0 if hs > 2.5 else 0.0
            penalty_rule = "25.0 if Hs > 2.5m"
            
        raw_deduction = (w1 * hs) + (w2 * w) + (w3 * l) + penalty
        safety_index = max(0.0, min(100.0, round(100.0 - raw_deduction, 2)))
        
        if safety_index >= 70.0:
            category = "Safe"
        elif safety_index >= 45.0:
            category = "Caution"
        elif safety_index >= 25.0:
            category = "Hazardous"
        else:
            category = "Extreme Danger"

        citation = f"Risk Specialist: Safety Index={safety_index}/100 ({category}) for {vessel_name} ({vessel_bracket}) | {defaults['mpa_name']} Buffer={mpa_distance} NM | IMBL={imbl_distance} NM"
    else:
        # Do NOT fabricate wave/wind values or compute a safety verdict without weather telemetry
        safety_index = None
        category = "Not Evaluated (Weather specialist omitted for this query)"
        citation = f"Risk Specialist: Geofence Only | {defaults['mpa_name']} Buffer={mpa_distance} NM | IMBL={imbl_distance} NM (Hydrodynamic safety omitted: weather data absent)"

    if is_in_restricted_zone:
        citation += f" | GEOFENCE ALERT: In {zone_name} [{zone_restr_type}] ({zone_auth}) - {zone_msg} | Source: {zone_src}"

    imbl_alert = imbl_distance < 15.0 or zd.get("is_near_international_boundary", False)
    mpa_alert = mpa_distance < 12.0 or (is_in_restricted_zone and zd.get("restriction_level") == "Strict")

    risk_payload: RiskAssessment = {
        "safety_index": safety_index,
        "risk_category": category,
        "vessel_class": vessel,
        "vessel_bracket": vessel_bracket,
        "applied_weights": {"w1": w1, "w2": w2, "w3": w3, "penalty": penalty, "penalty_rule": penalty_rule} if has_weather else None,
        "imbl_distance_nm": imbl_distance,
        "imbl_alert": imbl_alert,
        "mpa_distance_nm": mpa_distance,
        "mpa_alert": mpa_alert,
        "active_zone": zone_name if is_in_restricted_zone else None,
        "active_zone_data": zd if is_in_restricted_zone else None,
        "source": "Bharatmaps Parivesh Geofences & Sea-Venture Hydrodynamic Matrix",
    }
    
    return {
        "risk_data": risk_payload,
        "evidence_citations": [citation],
    }


