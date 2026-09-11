# ORCA Data Sources Documentation

This document serves as the running log for data integrations across MOSDAC, INCOIS, and Geofence layers. It details the exact fields and formats each source returns. This becomes the contract that the LangGraph agents will build against.

## 1. MOSDAC (ISRO)
- **Base URL**: `https://mosdac.gov.in/api/v1` (Note: Requires authentication/API Key)
- **Data Provided**: Sea Surface Temperature (SST), Chlorophyll concentration, Ocean Current.
- **Quirks / Notes**:
  - API expects date formats in ISO 8601 or specific string formats depending on the endpoint.
  - Returns raw numerical values which need units attached for the AI to reason properly.
  - Coordinate formats might require conversion between standard decimal degrees and specific local projections.
- **Contract**:
  - `get_sst(lat, lon, date)` -> `{"status": "success", "data": {"sst": float, "unit": str, ...}}`
  - `get_chlorophyll(lat, lon, date)` -> `{"status": "success", "data": {"chlorophyll": float, "unit": str, ...}}`

## 2. INCOIS ERDDAP
- **Base URL**: `https://erddap.incois.gov.in/erddap/`
- **Data Provided**: Potential Fishing Zone (PFZ) Advisories, Hazard/Weather Alerts (High Waves, Cyclones).
- **Quirks / Notes**:
  - ERDDAP has two main protocols: `tabledap` (tabular) and `griddap` (gridded).
  - Can fetch data directly in JSON (`.json`) or CSV (`.csv`) by appending the extension to the query.
  - Timestamp fields (`time`) are usually returned in UTC, so ensure alignment with local IST if needed.
- **Contract**:
  - `get_pfz_advisories(sector_name, date)` -> `{"status": "success", "data": {"sector": str, "pfz_zones": list, ...}}`
  - `get_hazard_alerts(lat, lon, date)` -> `{"status": "success", "data": {"alerts": list, ...}}`

## 3. Geofencing Dataset
- **Source**: Local GeoJSON (e.g., compiled from public GIS sources for EEZ, MPA, and International Boundaries).
- **Data Provided**: Restrictive boundary logic for safety constraints.
- **Contract**:
  - `check_zone(lat, lon)` -> `{"status": "success", "data": {"is_restricted": bool, "zone_name": str, ...}}`
