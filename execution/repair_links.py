import time
import db_client
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')

def repair_links():
    print("🔧 STARTING LINK REPAIR PROTOCOL...")
    
    # 1. Fetch Data
    print("   Fetching Projects...")
    projects_resp = db_client.query_db({"projects": {}})
    projects = projects_resp.get("projects", [])
    if not projects:
        print("   No projects found.")
        return

    print("   Fetching Signals...")
    signals_resp = db_client.query_db({"raw_signals": {}})
    signals = signals_resp.get("raw_signals", [])
    if not signals:
         print("   No signals found.")
         return

    print("   Fetching Sources...")
    sources_resp = db_client.query_db({"sources": {}})
    sources_list = sources_resp.get("sources", [])
    source_map = {s["id"]: s.get("url") for s in sources_list}
    print(f"   Indexed {len(source_map)} sources.")

    # Index signals by ID
    sig_by_id = {s["id"]: s for s in signals}
    
    print(f"   Analyzing {len(projects)} projects against {len(signals)} signals...")
    
    updates_count = 0
    
    for p in projects:
        # Check if needs repair (Relaxed check: if URL is 'Unknown' or missing)
        curr_url = p.get("source_url")
        curr_links = p.get("sourceLinks")
        
        needs_repair = False
        if not curr_url or curr_url == "Unknown" or curr_url == "No URL":
            needs_repair = True
        if not curr_links or len(curr_links) == 0 or curr_links[0] == "Unknown":
            needs_repair = True
            
        if not needs_repair:
            continue
            
        found_signal = None
        match_method = "None"
        
        # A. Try ID Match
        if p.get("source_signal_id") and p.get("source_signal_id") in sig_by_id:
            found_signal = sig_by_id[p["source_signal_id"]]
            match_method = "ID"
            
        # C. Fuzzy / Text Match
        if not found_signal:
            p_name = p.get("name", "").lower()
            if len(p_name) > 5:
                # Iterate all signals
                for s in signals:
                     content = s.get("content", "").lower()
                     if p_name in content:
                         found_signal = s
                         match_method = "CONTENT_FUZZY"
                         break
        
        if found_signal:
            # RESOLVE URL VIA SOURCE
            source_id = found_signal.get("source_id")
            url = source_map.get(source_id)
            
            if url:
                print(f"   🔗 RE-LINKING: {p.get('name')} <--> {url} ({match_method})")
                
                # Update DB
                try:
                    tx_steps = []
                    
                    # 1. Update fields
                    tx_steps.append([
                        "update", "projects", p["id"],
                        {
                            "source_url": url,
                            "sourceLinks": [url],
                            "latest_source": "TowerScout Intelligence"
                        }
                    ])
                    
                    # 2. Link relation
                    # tx_steps.append([
                    #     "link", "projects", p["id"], "signals", found_signal["id"]
                    # ])
                    
                    db_client.transact_db(tx_steps)
                    updates_count += 1
                except Exception as e:
                    print(f"      ⚠️ Failed to update: {e}")
            else:
                print(f"      ⚠️ Signal found but Source URL missing for source_id: {source_id}")
        else:
            print(f"   ⚠️ Could not find source for: {p.get('name')}")

    print(f"✅ REPAIR COMPLETE. Updated {updates_count} projects.")

if __name__ == "__main__":
    repair_links()
