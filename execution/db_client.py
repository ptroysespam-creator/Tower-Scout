import requests
import json
import time
from datetime import datetime

APP_ID = "3cda2be8-9300-4cbd-bfad-6d77d3118ced"
ADMIN_TOKEN = "ce5bd9f9-d2ed-4f54-bd7c-f3d6cf678031"
API_BASE_URL = "https://api.instantdb.com/admin"

def query_db(query_dict):
    """
    Executes a query against InstantDB.
    """
    url = f"{API_BASE_URL}/query"
    payload = {"query": query_dict}
    headers = {
        "Content-Type": "application/json",
        "App-Id": APP_ID,
        "Authorization": f"Bearer {ADMIN_TOKEN}"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"[DB Error] Query failed: {e}")
        return None

def transact_db(steps):
    """
    Executes a transaction against InstantDB.
    """
    url = f"{API_BASE_URL}/transact"
    payload = {"steps": steps}
    headers = {
        "Content-Type": "application/json",
        "App-Id": APP_ID,
        "Authorization": f"Bearer {ADMIN_TOKEN}"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()

    except Exception as e:
        print(f"[DB Error] Transaction failed: {e}")
        try:
             if 'response' in locals():
                 print(f"[DB Error Details] {response.text}")
        except:
            pass
        return None

def get_next_source():
    """
    Finds the source with the oldest 'last_crawled' date (or null).
    Returns (url, id) or (None, None).
    """
    # InstaQL: Select sources, include url and last_crawled
    # Note: InstantDB doesn't have robust sorting/LIMIT 1 in the basic query API easily exposed like SQL.
    # We will fetch all (or a chunk) and sort in Python for now as "The Harvester" logic implies.
    # Optimally we would use the 'where' clause if supported well by the HTTP API for null checks.
    
    query = {
        "sources": {}
    }
    
    data = query_db(query)
    if not data or "sources" not in data:
        return None, None
        
    sources = data["sources"]
    # InstantDB Admin API returns a list of objects, usually containing 'id'
    
    if not sources:
        return None, None
        
    # Sort: 
    # 1. Null last_crawled first (never crawled)
    # 2. Then oldest timestamp
    
    def sort_key(s):
        ts = s.get("last_crawled")
        if ts is None:
            return 0 # Oldest possible
        return ts
        
    sorted_sources = sorted(sources, key=sort_key)
    
    if not sorted_sources:
        return None, None
        
    target = sorted_sources[0]
    return target.get("url"), target.get("id")

def update_source_timestamp(source_id):
    """
    Updates the 'last_crawled' field of a source to the current timestamp (epoch ms).
    """
    now_ts = int(time.time() * 1000)
    
    # Transaction step to update
    tx_steps = [
        [
            "update", "sources", source_id, {"last_crawled": now_ts}
        ]
    ]
    
    return transact_db(tx_steps)

def add_raw_signal(source_id, content):
    """
    Adds a new raw signal to the 'raw_signals' table.
    """
    # Generate a random UUID for the signal or let InstantDB handle it if we could (but we need to specify ID usually)
    # We'll use a simple UUID generation here or just use a timestamp-based ID for simplicity if we don't want to import uuid
    import uuid
    signal_id = str(uuid.uuid4())
    
    now_ts = int(time.time() * 1000)
    
    tx_steps = [
        [
            "update", "raw_signals", signal_id, 
            {
                "source_id": source_id,
                "content": content,
                "created_at": now_ts,
                "status": "PENDING" 
            }
        ]
    ]
    
    return transact_db(tx_steps)

def get_unprocessed_signals(limit=10):
    """
    Fetches a batch of raw_signals where processed is not True.
    Returns a list of dicts.
    """
    # Fetch all for now as per previous pattern
    query = {"raw_signals": {}}
    data = query_db(query)
    
    if not data or "raw_signals" not in data:
        return []
        
    signals = data["raw_signals"]
    if not signals:
        return []
        
    # Filter for processed != True
    unprocessed = [s for s in signals if s.get("processed") is not True]
    
    # Return limited batch
    return unprocessed[:limit]

def get_projects_without_coordinates(limit=10):
    """
    Fetches a batch of projects that are missing coordinates.
    Returns a list of projects.
    """
    query = {"projects": {}}
    data = query_db(query)
    
    if not data or "projects" not in data:
        return []
        
    projects = data["projects"]
    if not projects:
        return []
        
    # Filter for missing coordinates (missing field or null)
    # Check if 'location' (dict) or 'coordinates' (dict) is missing/empty
    # The frontend uses 'coordinates' or 'location'.
    # We'll check 'coordinates' specifically as that seems to be the target.
    
    missing_coords = []
    for p in projects:
        # Check standard fields
        coords = p.get("coordinates")
        loc = p.get("location")
        
        has_coords = False
        if coords and isinstance(coords, dict) and coords.get("lat") and coords.get("lng"):
            has_coords = True
        elif loc and isinstance(loc, dict) and loc.get("lat") and loc.get("lng"):
            has_coords = True
            
        if not has_coords:
            missing_coords.append(p)
            
    return missing_coords[:limit]

def update_project_coordinates(project_id, lat, lng):
    """
    Updates a project's coordinates.
    """
    steps = [
        [
            "update", "projects", project_id, 
            {
                "coordinates": {"lat": lat, "lng": lng},
                "location": {"lat": lat, "lng": lng} # Redundant but safe for frontend support
            }
        ]
    ]
    return transact_db(steps)

def upsert_project(project_data):
    """
    Upserts a project into the 'projects' table.
    We generally match by 'name' or create a new ID. 
    For better deduplication, we might want a determinstic ID, but for now random UUID.
    """
    import uuid
    project_id = str(uuid.uuid4())
    
    # Check for existing project by name if possible?
    # For now, let's just insert/update. 
    # NOTE: If we want to UPSERT by name, we need to fetch and check. 
    # But strictly following "upsert_project" from before, it was just inserting new ones.
    # To be safer, let's stick to the previous simple implementation but maybe add a name check later?
    # The previous code just generated a new ID. We will stick to that to avoid breaking changes, 
    # but strictly speaking that is an INSERT, not UPSERT.
    
    steps = [
        [
            "update", "projects", project_id, project_data
        ]
    ]
    return transact_db(steps), project_id

def link_project_signal(project_id, signal_id):
    """
    Links a project to a signal.
    """
    steps = [
        [
            "link", "projects", project_id, "signals", signal_id
        ]
    ]
    return transact_db(steps)

def mark_signal_processed(signal_id, **updates):
    """
    Updates raw_signals row to processed=True and applies specific updates.
    """
    payload = {"processed": True}
    if updates:
        payload.update(updates)
        
    steps = [
        [
            "update", "raw_signals", signal_id, payload
        ]
    ]
    return transact_db(steps)

def check_source_exists(url):
    """
    Checks if a source URL already exists in the DB.
    Returns True if exists, False otherwise.
    """
    # Ideally we use a 'where' clause.
    # For now, fetching all seems to be the pattern due to API uncertainty/simplicity preference in this session.
    # Optimization: Use a targeted query if possible.
    query = {
        "sources": {
            "$": {
                "where": {
                    "url": url
                }
            }
        }
    }
    # Fallback to fetch all if the filter isn't 100% reliable without trying it.
    # But let's trust we can iterate. 
    # Actually, let's just use the fetch-all pattern from get_next_source so we are consistent.
    
    query = {"sources": {}}
    data = query_db(query)
    
    if not data or "sources" not in data:
        return False
        
    # normalization: strip slash?
    normalized_url = url.rstrip("/")
    
    for s in data["sources"]:
        s_url = s.get("url", "").rstrip("/")
        if s_url == normalized_url:
            return True
            
    return False

def add_source(url):
    """
    Adds a new source to the sources table.
    """
    import uuid
    source_id = str(uuid.uuid4())
    
    steps = [
        [
            "update", "sources", source_id, 
            {"url": url, "last_crawled": None}
        ]
    ]
    return transact_db(steps)
