import requests
import json

try:
    # No filters
    r = requests.get("http://127.0.0.1:8000/analytics/summary")
    print("--- No Filters ---")
    print(f"Status: {r.status_code}")
    print(json.dumps(r.json().get('summary'), indent=2))
    
    # 2012-2013 Filter
    params = {
        "start_date": "2012-01-01T00:00:00.000Z",
        "end_date": "2013-12-31T00:00:00.000Z"
    }
    r2 = requests.get("http://127.0.0.1:8000/analytics/summary", params=params)
    print("\n--- 2012-2013 Filter ---")
    print(f"Status: {r2.status_code}")
    print(json.dumps(r2.json().get('summary'), indent=2))
    
except Exception as e:
    print(f"Error: {e}")
