"""
ORCA Weather Specialist Agent.
Calls INCOIS alert data tools, evaluates marine weather hazard levels,
and updates the AgentState with structured weather findings.
"""

import sys
import os

# Ensure package resolution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agents.state import AgentState
from data.tools.incois_tools import get_alert_data


def weather_node(state: AgentState) -> AgentState:
    """
    Weather Agent Node.
    
    Extracts location coordinates from AgentState, calls get_alert_data(lat, lon),
    reasons over hazard conditions (wave height, wind speed, alert level),
    classifies conditions as SAFE / MODERATE / DANGEROUS, and populates weather_findings.
    Handles tool failures gracefully with fallback data.
    """
    location = state.get("location", {})
    lat = location.get("lat", 9.9312)
    lon = location.get("lon", 76.2673)
    loc_name = location.get("name", "Target Location")

    print(f"[WEATHER AGENT] Fetching INCOIS alert data for {loc_name} (Lat: {lat}, Lon: {lon})...")

    try:
        data = get_alert_data(lat, lon)
        if not data:
            raise ValueError("INCOIS tool returned empty payload.")

        wave_height = data.get("wave_height_m", 0.0)
        wind_speed = data.get("wind_speed_knots", 0.0)
        alert_level = data.get("alert_level", "GREEN")
        hazard_type = data.get("hazard_type", "None")

        # Reasoning logic over hazard parameters
        if wave_height > 3.0 or wind_speed > 25.0 or alert_level == "RED":
            status = "DANGEROUS"
            reasoning = f"DANGEROUS conditions near {loc_name}: High wave height ({wave_height}m), wind speed ({wind_speed} knots), and RED alert status ({hazard_type}). Venturing into sea is not recommended."
        elif wave_height > 1.5 or wind_speed > 15.0 or alert_level == "YELLOW":
            status = "MODERATE"
            reasoning = f"MODERATE conditions near {loc_name}: Swell waves ({wave_height}m) and moderate wind ({wind_speed} knots). Small vessels should exercise caution."
        else:
            status = "SAFE"
            reasoning = f"SAFE conditions near {loc_name}: Calm sea with wave height ({wave_height}m) and normal wind ({wind_speed} knots)."

        weather_findings = {
            "status": status,
            "wave_height": wave_height,
            "wind_speed": wind_speed,
            "alert_level": alert_level,
            "reasoning": reasoning
        }

    except Exception as e:
        print(f"[WEATHER AGENT WARNING] Tool call failed or raised exception: {e}. Executing fallback...")
        weather_findings = {
            "status": "UNKNOWN",
            "wave_height": 0.0,
            "wind_speed": 0.0,
            "alert_level": "GRAY",
            "reasoning": f"Weather data temporarily unavailable for {loc_name} due to data service error ({str(e)}). Defaulting to safe advisory standby."
        }

    state["weather_findings"] = weather_findings
    print(f"[WEATHER AGENT] Weather findings populated: {state['weather_findings']['status']} - {state['weather_findings']['reasoning']}")
    return state
