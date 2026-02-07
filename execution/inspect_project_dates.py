import db_client
import json

def inspect_projects():
    print("🔍 INSPECTING PROJECTS AND SIGNAL DATES...")
    
    # Fetch projects
    data = db_client.query_db({"projects": { "$": { "limit": 10 }, "signals": {} }})
    projects = data.get("projects", [])
    
    for p in projects:
        print(f"\nPROJECT: {p.get('name')}")
        signals = p.get("signals", [])
        print(f"Signals: {len(signals)}")
        for s in signals:
            print(f"  - Signal {s['id'][:8]} | ArticleDate: {s.get('article_date')} | CreatedAt: {s.get('created_at')}")

if __name__ == "__main__":
    inspect_projects()
