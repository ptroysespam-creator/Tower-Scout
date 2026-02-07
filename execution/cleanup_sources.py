import db_client
import logging
from urllib.parse import urlparse

logging.basicConfig(level=logging.INFO)

def is_root_domain(url):
    try:
        parsed = urlparse(url)
        # Check if path is empty or just slash, and no query/params
        if parsed.path not in ("", "/") or parsed.query or parsed.params:
            return False
        return True
    except:
        return False

def cleanup():
    print("--- SCOUT CLEANUP START ---")
    
    # 1. Fetch ALL sources
    query = {"sources": {}}
    data = db_client.query_db(query)
    
    if not data or "sources" not in data:
        print("No sources found.")
        return

    sources = data["sources"]
    print(f"Checking {len(sources)} sources...")
    
    deleted_count = 0
    
    for s in sources:
        url = s.get("url", "")
        if not url:
            continue
            
        if not is_root_domain(url):
            print(f"Found polluted source: {url}")
            
            # Delete
            steps = [
                ["delete", "sources", s.get("id")]
            ]
            db_client.transact_db(steps)
            print("Deleted.")
            deleted_count += 1
            
    print(f"--- CLEANUP COMPLETE. Deleted {deleted_count} sources. ---")

if __name__ == "__main__":
    cleanup()
