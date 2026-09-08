"""
ORCA AgentState Schema (SIH26176)
Canonical shared state dictionary passed across all nodes in the LangGraph DAG.
"""

import operator
from typing import TypedDict, Optional, List, Dict, Any, Annotated, Literal

UserRole = Literal["fisher", "coast_guard", "port_operator", "scientist"]


class LocationDict(TypedDict, total=False):
    lat: float
    lon: float
    name: str
    sector: str


class OceanTelemetry(TypedDict, total=False):
    sst_celsius: float
    sst_anomaly: float
    chlorophyll_a: float  # mg/m^3
    thermal_front: bool
    species_hsi: Dict[str, float]  # Habitat Suitability Index [0.0 - 1.0]
    pfz_coordinates: List[Dict[str, float]]
    source: str
    timestamp: str


class WeatherTelemetry(TypedDict, total=False):
    significant_wave_height_m: float  # Hs
    wave_period_s: float
    wind_speed_knots: float  # W
    wind_direction_deg: float
    lightning_squall_prob_pct: float  # L
    cyclone_alert_level: str  # "Green", "Yellow", "Amber", "Red"
    source: str
    timestamp: str


class RiskAssessment(TypedDict, total=False):
    safety_index: float  # 0 to 100
    risk_category: str  # "Safe", "Caution", "Hazardous", "Extreme Danger"
    imbl_distance_nm: float  # Distance to International Maritime Boundary Line
    imbl_alert: bool
    mpa_distance_nm: float  # Distance to Marine Protected Area
    mpa_alert: bool
    source: str


class PublicResearchData(TypedDict, total=False):
    found: bool
    reason: Optional[str]
    checked_sources: List[str]
    source_url: Optional[str]
    retrieved_at: Optional[str]
    source_type: Literal["Official Government Bulletin (Secondary/Cached)"]
    confidence: Literal["Secondary source — not a live authoritative feed"]
    bulletin_title: Optional[str]
    summary: Optional[str]
    raw_snippet: Optional[str]
    agency: Optional[str]


class AgentState(TypedDict, total=False):
    # Core User Input
    query: str
    transcribed_text: Optional[str]
    language: str  # 'en', 'hi', 'bn', 'mr', 'ta'
    
    # Metadata & Context
    location: LocationDict
    vessel_type: str  # 'small' (<8m), 'medium' (8-15m), 'large' (>15m)
    user_role: Optional[UserRole]  # 'fisher', 'coast_guard', 'port_operator', 'scientist' (default: 'fisher')
    intent: List[str]  # e.g. ["pfz", "safety", "weather", "geofence", "public_bulletin"]
    
    # Specialist Data Payloads
    ocean_data: Optional[OceanTelemetry]
    weather_data: Optional[WeatherTelemetry]
    risk_data: Optional[RiskAssessment]
    public_research_data: Optional[PublicResearchData]
    
    # Traceability & Verification
    evidence_citations: Annotated[List[str], operator.add]
    final_response: str
    messages: Annotated[List[Dict[str, Any]], operator.add]

