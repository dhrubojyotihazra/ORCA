"""
ORCA Risk & Geofence Specialist Agent.
Combines geofence boundary checks (MPA, Restricted Naval Zones, IMBL) with
weather and oceanographic findings from previous agents to calculate overall risk levels
(LOW / MODERATE / HIGH / CRITICAL) and actionable recommendations.
"""

import sys
import os
from typing import List

# Ensure package resolution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agents.state import AgentState
from data.tools.geofence_tools import check_geofence


def risk_node(state: AgentState) -> AgentState:
    """
    Risk Agent Node.
    
    1. Reads location from state and calls check_geofence(lat, lon).
    2. Reads weather_findings and ocean_findings from state.
    3. Combines geofence status + weather findings + ocean findings to compute risk level.
    
    Risk Scoring Logic:
      - CRITICAL: Location is in a Restricted Zone / MPA OR Weather is DANGEROUS.
      - HIGH: Location is on an IMBL boundary OR (Weather is MODERATE and Ocean quality is LOW).
      - MODERATE: Weather is MODERATE OR Ocean quality is LOW.
      - LOW: Safe open water, Weather is SAFE, Ocean quality is HIGH or MODERATE.
      
    Populates risk_findings in state:
      - geofence_status (str)
      - zone_type (str)
      - risk_level (str: LOW / MODERATE / HIGH / CRITICAL)
      - risk_reasons (list[str])
      - recommendation (str)
    """
    location = state.get("location", {})
    lat = location.get("lat", 9.9312)
    lon = location.get("lon", 76.2673)
    loc_name = location.get("name", "Target Location")

    weather_findings = state.get("weather_findings", {})
    ocean_findings = state.get("ocean_findings", {})

    weather_status = weather_findings.get("status", "SAFE")
    ocean_quality = ocean_findings.get("zone_quality", "MODERATE")

    print(f"[RISK AGENT] Checking geofence and evaluating risk for {loc_name} (Lat: {lat}, Lon: {lon})...")

    risk_reasons: List[str] = []
    
    try:
        geo_data = check_geofence(lat, lon)
        if not geo_data:
            raise ValueError("Geofence tool returned empty response.")

        geofence_status = geo_data.get("geofence_status", "CLEAR")
        zone_type = geo_data.get("zone_type", "SAFE_OPEN_WATER")
        is_restricted = geo_data.get("is_restricted", False)
        advisory = geo_data.get("advisory", "")

    except Exception as e:
        print(f"[RISK AGENT WARNING] Geofence tool failed: {e}. Using fallback clear status.")
        geofence_status = "UNKNOWN"
        zone_type = "SAFE_OPEN_WATER"
        is_restricted = False
        advisory = "Geofence tool data unavailable. Defaulting to clear warning standby."
        risk_reasons.append(f"Geofence data service error: {str(e)}")

    # Evaluate Geofence Factors
    if is_restricted or zone_type in ["MPA", "RESTRICTED_NAVAL_ZONE"]:
        risk_reasons.append(f"GEOFENCE ALERT: Location is inside a restricted zone ({zone_type}: {advisory}).")
    elif zone_type == "IMBL_BOUNDARY":
        risk_reasons.append(f"BOUNDARY WARNING: Location is near the International Maritime Boundary Line (IMBL).")

    # Evaluate Weather Factors
    if weather_status == "DANGEROUS":
        risk_reasons.append(f"WEATHER HAZARD: Sea weather conditions are DANGEROUS ({weather_findings.get('reasoning', '')}).")
    elif weather_status == "MODERATE":
        risk_reasons.append(f"WEATHER CAUTION: Sea weather conditions are MODERATE ({weather_findings.get('reasoning', '')}).")

    # Evaluate Ocean Factors
    if ocean_quality == "LOW":
        risk_reasons.append(f"OCEAN ADVISORY: Fish productivity zone quality is LOW ({ocean_findings.get('reasoning', '')}).")

    # Determine Overall Risk Level based on combined findings
    if is_restricted or zone_type in ["MPA", "RESTRICTED_NAVAL_ZONE"] or weather_status == "DANGEROUS":
        risk_level = "CRITICAL"
        recommendation = "DO NOT VENTURE / CEASE OPERATIONS IMMEDIATELY: Location is either restricted or weather conditions present grave danger."
    elif zone_type == "IMBL_BOUNDARY" or (weather_status == "MODERATE" and ocean_quality == "LOW"):
        risk_level = "HIGH"
        recommendation = "HIGH RISK: Exercise extreme caution near maritime boundaries or when bad weather coincides with poor catch yield."
    elif weather_status == "MODERATE" or ocean_quality == "LOW":
        risk_level = "MODERATE"
        recommendation = "MODERATE RISK: Proceed with caution. Maintain communication channels and stay aware of swell/wind changes."
    else:
        risk_level = "LOW"
        recommendation = "LOW RISK: Safe open waters with favourable weather and ocean conditions. Standard fishing operations permitted."

    if not risk_reasons:
        risk_reasons.append("All safety parameters (geofence, weather, ocean) are within normal clear bounds.")

    risk_findings = {
        "geofence_status": geofence_status,
        "zone_type": zone_type,
        "risk_level": risk_level,
        "risk_reasons": risk_reasons,
        "recommendation": recommendation
    }

    state["risk_findings"] = risk_findings
    print(f"[RISK AGENT] Risk evaluation complete: Level={risk_level}, Geofence={geofence_status}, Zone={zone_type}")
    return state
