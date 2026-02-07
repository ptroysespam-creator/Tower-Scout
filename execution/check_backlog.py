import db_client

def check_backlog():
    print("Checking backlog...")
    
    # Fetch all data (warning: might be large, but we need counts)
    # Using the client's internal query logic but exposing a count here would be better if CLIENT had it.
    # We'll just define a custom query here for simplicity or reuse existing logic if possible.
    
    query = {
        "raw_signals": {},
        "projects": {}
    }
    
    data = db_client.query_db(query)
    
    if not data:
        print("Failed to fetch data.")
        return
        
    signals = data.get("raw_signals", [])
    projects = data.get("projects", [])
    
    total_signals = len(signals)
    unprocessed_signals = len([s for s in signals if s.get("processed") is not True])
    total_projects = len(projects)
    
    projects_missing_coords = 0
    for p in projects:
        coords = p.get("coordinates")
        if not coords:
            projects_missing_coords += 1
        else:
             if not (isinstance(coords, dict) and coords.get("lat") and coords.get("lng")):
                 projects_missing_coords += 1
    
    print("-" * 30)
    print(f"Total Raw Signals:      {total_signals}")
    print(f"Unprocessed Signals:    {unprocessed_signals}")
    print(f"Total Projects:         {total_projects}")
    print(f"Projects w/o Coords:    {projects_missing_coords}")
    print("-" * 30)

if __name__ == "__main__":
    check_backlog()
