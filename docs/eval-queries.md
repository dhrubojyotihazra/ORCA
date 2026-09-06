# Evaluation Queries for ORCA

This document tracks the eight sample queries defined in the official ISRO brief, which the multi-agent system (and specifically the data tools) must eventually answer end-to-end.

## Query 1
**Query:** "Where is the nearest Potential Fishing Zone (PFZ) today?"
**Expected Data Tool Calls:**
- `get_pfz_advisories(sector_name, today)`
**Expected Agent Output:** Plain language location, distance/direction from user's current or specified location.

## Query 2
**Query:** "Is it safe to venture into the sea tomorrow morning?"
**Expected Data Tool Calls:**
- `get_hazard_alerts(lat, lon, tomorrow)`
**Expected Agent Output:** Clear Yes/No/Warning based on wave height, wind, or cyclone data.

## Query 3
**Query:** "What are the tide, weather, and sea conditions near my fishing location?"
**Expected Data Tool Calls:**
- `get_ocean_current(lat, lon, today)`
- `get_hazard_alerts(lat, lon, today)`
**Expected Agent Output:** Summary of tide height, weather status (clear, rainy), and sea state (calm, rough).

## Query 4
**Query:** "Are there any lightning or cyclone alerts in my area?"
**Expected Data Tool Calls:**
- `get_hazard_alerts(lat, lon, today)`
**Expected Agent Output:** Immediate alert status for lightning or cyclones.

## Query 5
**Query:** "Which regions show high chlorophyll concentration and favourable sea surface temperature?"
**Expected Data Tool Calls:**
- `get_chlorophyll(lat, lon, date)` (perhaps sampled over a grid)
- `get_sst(lat, lon, date)` (sampled over a grid)
**Expected Agent Output:** Identification of regions matching favorable criteria. (Note: The planner might instead query INCOIS PFZ directly if it correlates).

## Query 6
**Query:** "What is the safest route for a fishing vessel given current weather and sea state?"
**Expected Data Tool Calls:**
- `get_hazard_alerts(lat, lon, today)` (for multiple points along route)
- `get_ocean_current(lat, lon, today)`
**Expected Agent Output:** Recommended route avoiding hazards.

## Query 7
**Query:** "Why has fish productivity declined in a particular coastal region?"
**Expected Data Tool Calls:**
- `get_sst(lat, lon, historical_dates)`
- `get_chlorophyll(lat, lon, historical_dates)`
**Expected Agent Output:** Correlative analysis of historical SST/chlorophyll changes.

## Query 8
**Query:** "Which fishing zones should be avoided due to hazardous conditions or geofencing restrictions?"
**Expected Data Tool Calls:**
- `check_zone(lat, lon)`
- `get_hazard_alerts(lat, lon, today)`
**Expected Agent Output:** List of specific zones (e.g., MPAs, areas with high waves) to avoid.
