
import db_client

def check_progress():
    print("Fetching all signals...")
    query = {"raw_signals": {}}
    data = db_client.query_db(query)
    
    if not data or "raw_signals" not in data:
        print("No signals found.")
        return

    signals = data["raw_signals"]
    total = len(signals)
    with_date = len([s for s in signals if s.get("article_date")])
    with_url = len([s for s in signals if s.get("url")])
    
    print(f"Total Signals: {total}")
    print(f"With Article Date: {with_date} ({with_date/total*100:.1f}%)")
    print(f"With URL: {with_url}")

if __name__ == "__main__":
    check_progress()
