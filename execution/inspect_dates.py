import db_client
import json

def inspect_dates():
    print("🔍 INSPECTING RAW SIGNAL DATES...")
    
    # Fetch random batch of raw signals
    data = db_client.query_db({"raw_signals": { "$": { "limit": 20 } }})
    signals = data.get("raw_signals", [])
    
    print(f"Fetched {len(signals)} signals.")
    
    for s in signals:
        sid = s.get("id")
        ad = s.get("article_date")
        ca = s.get("created_at")
        
        print(f"ID: {sid[:8]} | ArticleDate: '{ad}' ({type(ad)}) | CreatedAt: {ca} ({type(ca)})")

if __name__ == "__main__":
    inspect_dates()
