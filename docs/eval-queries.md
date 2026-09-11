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

---

## Role-Aware Evaluation Matrix (SIH26176 Core Requirement)

The ORCA Synthesizer Agent dynamically formats responses across four operational stakeholder registers based on the `user_role` state parameter (`userRole` in request payload), while strictly maintaining numerical identity and honest data provenance across all four:

### Standard Evaluation Test Query
- **Prompt:** `"Is it safe to venture out from Paradip for fishing today?"`
- **Vessel Class:** `medium` (Motorized Craft, 8–15 m)
- **Anchor:** Paradip Harbour (Zone 4, Odisha)

### Operational Registers & Verification Matrix

| Register ID (`user_role`) | Target Audience | Vocabulary & Register | Structural Requirements | Key Behavioral Rule |
| :--- | :--- | :--- | :--- | :--- |
| **`fisher`** *(Default)* | Artisanal & motorized coastal fishermen | Plain language, action-first verdict, simple and direct | Leading colored alert banner (`🟢` Safe, `🟡` Caution, `🔴` Danger), simple sea state summary, vernacular default | Zero raw mathematical formulas ($w_1, w_2, w_3$). Direct advice on catch suitability and sea conditions. Automatically invoked when `user_role` is omitted or unset. |
| **`coast_guard`** | Maritime enforcement, Search & Rescue (SAR) controllers | Military / SAR operational brevity, tactical codes | SAR Readiness posture (e.g., Level 2 Standby), patrol radius, MPA / IMBL buffer distances with tactical clearances, vessel seaworthiness compliance | Mandatory explicit reporting of boundary coordinates and SAR state. |
| **`port_operator`** | Harbour masters, terminal supervisors, port logistics | Port operations, berthing, and marine traffic safety | Port operational limits table, vessel transit allowances for 8–15 m motorized craft, breakwater wave action, cargo lightering warnings | Focus on harbour channel navigation, wind velocity thresholds, and berthing safety. |
| **`scientist`** | Oceanographers, marine biologists, climate researchers | Peer-reviewed technical and mathematical rigor | Exhaustive environmental parameter table with complete SI units, complete Hydrodynamic Safety Index equation with exact substituted values using LaTeX ($$...$$), Species HSI breakdown table | Mathematical transparency with step-by-step substitution and explicit dataset provenance (ARGO Float IDs, ASCAT satellite datasets, Open-Meteo nowcasts). |

### Verification Invariants Across All Registers
1. **Numerical Identity**: All four registers receive identical underlying specialist data ($H_s = 1.04\text{ m}$, $W = 14.9\text{ kts}$, $\text{Safety Index} = 65.71/100$, $\text{SST} = 30.22^\circ\text{C}$, $\text{Chlorophyll-a} = 1.82\text{ mg/m}^3$). Only presentation, vocabulary, and depth change.
2. **Honest Provenance Preservation**: Every register faithfully preserves live vs. baseline vs. climatology qualifications (`Open-Meteo Live`, `INCOIS ERDDAP Most recent satellite observation: 2023-05-20`, `INCOIS Regional Climatology Baseline`, `Bathymetric Shelf-Break Model (Illustrative)`).
3. **Graceful Defaulting**: Any request without an explicit `userRole` automatically and deterministically resolves to `fisher`.

