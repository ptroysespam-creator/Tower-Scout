import db_client
import collections
from datetime import datetime

def check_date_quality():
    print("🔍 DIAGNOSTIC: Checking Date Quality...")
    
    # 1. Fetch Raw Signals
    data = db_client.query_db({"raw_signals": {}})
    signals = data.get("raw_signals", [])
    
    print(f"Total Signals: {len(signals)}")
    
    missing_dates = 0
    malformed_dates = 0
    good_dates = 0
    
    formats = collections.Counter()
    
    for s in signals:
        ad = s.get("article_date")
        if not ad:
            missing_dates += 1
            continue
            
        # Check format
        try:
            # Check if YYYY-MM-DD
            datetime.strptime(ad, "%Y-%m-%d")
            good_dates += 1
            formats["YYYY-MM-DD"] += 1
        except ValueError:
            malformed_dates += 1
            formats[f"Other ({ad[:20]})"] += 1

    print(f"✅ Good Dates (YYYY-MM-DD): {good_dates}")
    print(f"⚠️ Missing Dates: {missing_dates}")
    print(f"❌ Malformed Dates: {malformed_dates}")
    
    if malformed_dates > 0:
        print("\nMalformed Examples:")
        for k, v in formats.items():
            if k != "YYYY-MM-DD":
                print(f"  - {k}: {v}")

if __name__ == "__main__":
    check_date_quality()
