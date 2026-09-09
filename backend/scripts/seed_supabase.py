import os
import sys
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.supabase_client import get_supabase_admin_client, get_supabase_client

def seed_data():
    client = get_supabase_admin_client() or get_supabase_client()
    if not client:
        print("ERROR: Supabase client could not be initialized.")
        return

    print("Seeding alerts and geofence zones into Supabase...")
    now = datetime.now(timezone.utc)

    # 1. Real Indian Coastal Hazard Alerts
    alerts_data = [
        {
            "severity": "red",
            "title": "Severe Cyclone Alert (Arabian Sea)",
            "description": "Squally winds 75-85 km/h gusting to 95 km/h along Gujarat Saurashtra coast. High swell waves 3.5m - 4.5m. Total suspension of fishing operations advised off Veraval and Porbandar.",
            "source": "IMD Ahmedabad & INCOIS Hyderabad",
            "expires_at": (now + timedelta(days=2)).isoformat(),
            "affected_area": "POLYGON((69.5 20.0, 71.5 20.0, 71.5 21.8, 69.5 21.8, 69.5 20.0))"
        },
        {
            "severity": "amber",
            "title": "High Swell Surge Warning (Konkan Coast)",
            "description": "Swell surge waves of 2.5m - 3.2m with period 14-16 seconds forecasted during high tide for Mumbai, Raigad, and Ratnagiri coastal waters.",
            "source": "INCOIS Hyderabad",
            "expires_at": (now + timedelta(hours=36)).isoformat(),
            "affected_area": "POLYGON((72.0 18.0, 73.5 18.0, 73.5 19.5, 72.0 19.5, 72.0 18.0))"
        },
        {
            "severity": "info",
            "title": "Potential Fishing Zone (PFZ) Advisory - Saurashtra Sector",
            "description": "High chlorophyll concentration (1.8-2.4 mg/m3) and SST thermal front (28.2°C) observed 25-45 nautical miles WSW of Veraval. Favourable for Pelagic catch.",
            "source": "INCOIS WebGIS / ISRO MOSDAC",
            "expires_at": (now + timedelta(days=3)).isoformat(),
            "affected_area": "POLYGON((69.8 20.5, 70.8 20.5, 70.8 21.2, 69.8 21.2, 69.8 20.5))"
        },
        {
            "severity": "amber",
            "title": "Rough Sea & Strong Wind Advisory (Coromandel Coast)",
            "description": "Wind speeds reaching 45-55 km/h along Tamil Nadu and South Andhra coast. Fishermen advised to exercise caution near Chennai and Puducherry.",
            "source": "IMD Chennai",
            "expires_at": (now + timedelta(hours=24)).isoformat(),
            "affected_area": "POLYGON((80.0 12.0, 81.5 12.0, 81.5 14.0, 80.0 14.0, 80.0 12.0))"
        }
    ]

    # 2. Geofence Zones (MPAs & IMBL Boundaries)
    geofence_data = [
        {
            "name": "India - Sri Lanka International Maritime Boundary Line (IMBL)",
            "zone_type": "IMBL",
            "description": "Critical international maritime boundary line across Palk Bay and Gulf of Mannar. Indian fishermen strictly restricted from crossing into Sri Lankan territorial waters.",
            "boundary": "POLYGON((79.2 9.0, 80.2 9.0, 80.2 10.4, 79.2 10.4, 79.2 9.0))"
        },
        {
            "name": "Gulf of Mannar Marine National Park",
            "zone_type": "MPA",
            "description": "Protected biosphere reserve comprising 21 core islands. Commercial bottom trawling, coral extraction, and mechanized fishing strictly banned under Wildlife Protection Act.",
            "boundary": "POLYGON((78.1 8.7, 79.3 8.7, 79.3 9.3, 78.1 9.3, 78.1 8.7))"
        },
        {
            "name": "Malvan Marine Sanctuary",
            "zone_type": "MPA",
            "description": "Maharashtra coastal marine sanctuary encompassing Sindhudurg fort and adjoining coral reef zones. Commercial purse-seine and mechanized trawling prohibited within 3 km.",
            "boundary": "POLYGON((73.4 15.9, 73.6 15.9, 73.6 16.1, 73.4 16.1, 73.4 15.9))"
        },
        {
            "name": "Sundarbans National Park Aquatic Buffer",
            "zone_type": "RESTRICTED",
            "description": "Sensitive mangrove estuary and crocodile/dolphin sanctuary buffer in West Bengal. Unlicensed commercial vessels strictly prohibited.",
            "boundary": "POLYGON((88.5 21.5, 89.2 21.5, 89.2 22.0, 88.5 22.0, 88.5 21.5))"
        }
    ]

    try:
        # Clear existing seeded rows if any
        client.table("alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        res_alerts = client.table("alerts").insert(alerts_data).execute()
        print(f"Successfully inserted {len(res_alerts.data)} alerts into Supabase.")
    except Exception as e:
        print(f"Error inserting alerts: {e}")

    try:
        client.table("geofence_zones").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        res_zones = client.table("geofence_zones").insert(geofence_data).execute()
        print(f"Successfully inserted {len(res_zones.data)} geofence zones into Supabase.")
    except Exception as e:
        print(f"Error inserting geofence zones: {e}")

if __name__ == "__main__":
    seed_data()
