import db_client
import json

def inspect_signal_content():
    print("🔍 INSPECTING SIGNAL CONTENT FOR DATE PATTERNS...")
    
    # Fetch signals without article_date
    data = db_client.query_db({"raw_signals": {}})
    signals = data.get("raw_signals", [])
    
    unprocessed = [s for s in signals if not s.get("article_date")]
    
    print(f"Sampling {min(5, len(unprocessed))} targets...")
    
    for s in unprocessed[:5]:
        content = s.get("content", "")
        print(f"\n--- Signal {s['id'][:8]} ---")
        print(f"URL: {s.get('source_url')}")
        print("Start of content:")
        print(content[:500])
        print("---")

if __name__ == "__main__":
    inspect_signal_content()
