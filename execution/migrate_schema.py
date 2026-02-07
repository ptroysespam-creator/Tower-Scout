import db_client
import logging
import time

logging.basicConfig(level=logging.INFO)

def migrate():
    print("--- MIGRATING SCHEMA (BACKFILL) ---")
    
    # 1. Fetch all projects
    query = {"projects": {}}
    data = db_client.query_db(query)
    
    if not data or "projects" not in data:
        print("No projects to migrate.")
        return

    projects = data["projects"]
    print(f"Checking {len(projects)} projects...")
    
    new_fields = [
        "gdv", "sales_team", "lender", "architect", 
        "key_people", "delivery_date", "unit_mix", "status_stage"
    ]
    
    updated_count = 0
    
    for p in projects:
        project_id = p.get("id")
        updates = {}
        
        for field in new_fields:
            if field not in p:
                updates[field] = None # Or "Unknown"? None is better for "not set".
        
        if updates:
            # Upsert updates
            steps = [
                ["update", "projects", project_id, updates]
            ]
            db_client.transact_db(steps)
            updated_count += 1
            print(f"Updated Project {project_id} with {list(updates.keys())}")
            time.sleep(0.1) # Pace
            
    print(f"--- MIGRATION COMPLETE. Backfilled {updated_count} projects. ---")

if __name__ == "__main__":
    migrate()
