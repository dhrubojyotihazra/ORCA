# Evaluation Query Results

Results of running the 8 official ISRO queries against the data tools.

## Query 1: Nearest PFZ
`json
{'status': 'success', 'data': {'sector': 'Gujarat', 'date': '2026-09-10', 'pfz_zones': [{'lat': 20.1, 'lon': 70.2, 'depth': '30-50m'}, {'lat': 20.3, 'lon': 70.5, 'depth': '50-100m'}], 'source': 'INCOIS'}}
`

## Query 2: Safety to venture (Hazards)
`json
{'status': 'success', 'data': {'lat': 22.5, 'lon': 69.5, 'date': '2026-09-10', 'alerts': [{'type': 'High Wave', 'severity': 'Warning', 'message': 'High waves expected up to 3m.'}], 'source': 'INCOIS'}}
`

## Query 3: Tide, weather, sea conditions
`json
{'status': 'success', 'latitude': 22.5, 'longitude': 69.5, 'date': '2026-09-10', 'current_speed_m_s': 0.45, 'current_direction_deg': 135.0, 'quality_flag': 'GOOD', 'sensor': 'ISRO Oceansat-3 Scatterometer', 'data': {'lat': 22.5, 'lon': 69.5, 'date': '2026-09-10', 'speed': 0.45, 'speed_m_s': 0.45, 'speed_unit': 'm/s', 'direction': 135.0, 'direction_deg': 135.0, 'direction_unit': 'degrees', 'quality_flag': 'GOOD', 'sensor': 'ISRO Oceansat-3 Scatterometer', 'source': 'MOSDAC'}}
`

## Query 5: Chlorophyll & SST
`json
{'status': 'success', 'latitude': 22.5, 'longitude': 69.5, 'date': '2026-09-10', 'chlorophyll_mg_m3': 1.25, 'quality_flag': 'GOOD', 'sensor': 'ISRO Oceansat-3 OCM', 'data': {'lat': 22.5, 'lon': 69.5, 'date': '2026-09-10', 'chlorophyll': 1.25, 'chlorophyll_mg_m3': 1.25, 'unit': 'mg/m^3', 'quality_flag': 'GOOD', 'sensor': 'ISRO Oceansat-3 OCM', 'source': 'MOSDAC'}}
{'status': 'success', 'latitude': 22.5, 'longitude': 69.5, 'date': '2026-09-10', 'sst_celsius': 28.5, 'quality_flag': 'GOOD', 'sensor': 'ISRO Oceansat-3', 'data': {'lat': 22.5, 'lon': 69.5, 'date': '2026-09-10', 'sst': 28.5, 'sst_celsius': 28.5, 'unit': 'Celsius', 'quality_flag': 'GOOD', 'sensor': 'ISRO Oceansat-3', 'source': 'MOSDAC'}}
`

## Query 8: Geofencing Restrictions
`json
{'status': 'success', 'data': {'lat': 22.5, 'lon': 69.5, 'is_restricted': False, 'is_near_international_boundary': False, 'zone_name': 'Open Water / EEZ', 'restriction_type': 'Navigable Waters', 'restriction_level': 'None', 'authority': 'Indian Coast Guard / DG Shipping', 'source': 'Bharatmaps Parivesh & Navigational Reference Baselines', 'message': 'Clear to operate.'}}
`

## Summary
All tools successfully returned structurally compliant JSON for the LangGraph agents to consume.
