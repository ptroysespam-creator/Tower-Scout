import time
from datetime import datetime
from db_client import query_db

def check_status():
    print("--- TOWER SCOUT SYSTEM AUDIT ---")
    
    # 1. Fetch Data
    query = {
        "sources": {},
        "raw_signals": {}
    }
    data = query_db(query)
    
    if not data:
        print("CRITICAL: Database connection failed or returned empty.")
        return

    sources = data.get("sources", [])
    signals = data.get("raw_signals", [])

    # 2. Calculate Stats
    total_sources = len(sources)
    
    active_sources_count = 0
    timestamps = []
    
    for s in sources:
        last_crawled = s.get("last_crawled")
        if last_crawled is not None:
            active_sources_count += 1
            timestamps.append(last_crawled)
            
    total_signals = len(signals)
    
    # 3. Determine Recency
    recency_msg = "No activity yet."
    if timestamps:
        latest_ts = max(timestamps)
        # Assuming timestamps are in milliseconds (epoch)
        now_ts = int(time.time() * 1000)
        diff_ms = now_ts - latest_ts
        diff_min = diff_ms / 1000 / 60
        
        recency_msg = f"{diff_min:.2f} minutes ago"
        
        # Convert latest_ts to readable string
        dt_object = datetime.fromtimestamp(latest_ts / 1000)
        recency_msg += f" ({dt_object.strftime('%Y-%m-%d %H:%M:%S')})"

    # 4. Print Report
    print(f"Total Sources:       {total_sources}")
    print(f"Active Sources:      {active_sources_count}")
    print(f"Total Signals:       {total_signals}")
    print(f"Most Recent Crawl:   {recency_msg}")
    print("--------------------------------")

if __name__ == "__main__":
    check_status()
