import os
import sys
import httpx
import json

SUPABASE_TOKEN = os.getenv("SUPABASE_ACCESS_TOKEN", "")
PROJECT_REF = os.getenv("SUPABASE_PROJECT_REF", "tpsbavjmnqevlvrermnf")

def run_query(sql: str):
    headers = {
        "Authorization": f"Bearer {SUPABASE_TOKEN}",
        "Content-Type": "application/json"
    }
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"
    resp = httpx.post(url, headers=headers, json={"query": sql}, timeout=30.0)
    print(f"Status: {resp.status_code}")
    try:
        print(json.dumps(resp.json(), indent=2))
    except Exception:
        print(resp.text)
    return resp

if __name__ == "__main__":
    sql = sys.argv[1] if len(sys.argv) > 1 else "SELECT 1;"
    run_query(sql)
