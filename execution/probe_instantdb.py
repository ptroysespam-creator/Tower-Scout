import requests
import json

APP_ID = "3cda2be8-9300-4cbd-bfad-6d77d3118ced"

# Common InstantDB endpoints based on patterns
ENDPOINTS = [
    "https://api.instantdb.com/admin/query",
    "https://api.instantdb.com/runtime/query"
]

def probe():
    print(f"Probing InstantDB for App ID: {APP_ID}")
    
    # Simple query to list sources (assuming 'sources' table exists)
    # InstaQL format: { "sources": {} }
    query_payload = {"query": {"sources": {}}}
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "App-Id": APP_ID
    }
    
    for url in ENDPOINTS:
        print(f"\nTesting endpoint: {url}")
        try:
            response = requests.post(url, json=query_payload, headers=headers, timeout=5)
            print(f"Status: {response.status_code}")
            print(f"Headers: {response.headers}")
            print(f"Response Text: '{response.text}'")
            
            if response.status_code == 200 and response.text.strip():
                try:
                    response.json()
                    print("SUCCESS: Endpoint is working and returning JSON!")
                    return url
                except json.JSONDecodeError:
                    print("Failed to decode JSON.")
            elif response.status_code == 200:
                 print("Received 200 OK but empty body.")

        except Exception as e:
            print(f"Error: {e}")

    print("\nProbe finished. No open public endpoint found or all failed.")
    return None

if __name__ == "__main__":
    probe()
