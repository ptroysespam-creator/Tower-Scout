import db_client
import json

resp = db_client.query_db({
    "projects": {"$": {"limit": 5}}, 
    "raw_signals": {"$": {"limit": 5}}
})

print("--- PROJECTS SAMPLE ---")
projects = resp.get("projects", [])
for p in projects:
    print(f"Project: {p.get('name')}")
    print(f"  Source URL: {p.get('source_url')}")
    print(f"  SourceLinks: {p.get('sourceLinks')}")
    print(f"  Stage: {p.get('status_stage')}")

print("\n--- SIGNALS SAMPLE ---")
signals = resp.get("raw_signals", [])
for s in signals:
    print(f"Signal: {s.get('id')}")
    print(f"  URL: {s.get('url')}")
    print(f"  Date: {s.get('article_date')}")
