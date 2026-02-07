import re
import db_client
from dateutil import parser
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

def extract_date_heuristic(text):
    if not text: return None
    
    # Limit search to first 2000 chars (Header/Metadata area)
    header = text[:3000]
    
    # 1. Look for explicit labels
    # "Published: Jan 12, 2024"
    explicit_pattern = r'(?i)(published|posted|date|updated)[:\s-]+([A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4})'
    match = re.search(explicit_pattern, header)
    if match:
        try:
            dt = parser.parse(match.group(2))
            if 2018 <= dt.year <= 2027:
                return dt.strftime("%Y-%m-%d")
        except:
            pass

    # 2. Look for standalone dates (Common formats)
    # January 12, 2024
    dates = []
    # Regex for "Month DD, YYYY"
    # Matches: Jan 1, 2024 | January 01, 2024 | Sept. 12, 2023
    regex_verbose = r'([A-Z][a-z]{2,8}\.?\s+\d{1,2},?\s+\d{4})'
    
    candidates = re.findall(regex_verbose, header)
    
    for c in candidates:
        try:
            dt = parser.parse(c)
            # Filter valid range for this project (2020-2026)
            if 2020 <= dt.year <= 2027:
                dates.append(dt)
        except:
            continue
            
    if dates:
        # Usually the first date found in header is the pub date.
        # But if we find multiple, maybe the one closest to "today" without being in future?
        # Or just the first one found (top of page).
        return dates[0].strftime("%Y-%m-%d")

    return None

def run_fix():
    print("SEARCHING FOR DATES (REGEX MODE)...")
    data = db_client.query_db({"raw_signals": {}})
    signals = data.get("raw_signals", [])
    
    targets = [s for s in signals if s.get("processed") is True and not s.get("article_date")]
    print(f"Found {len(targets)} signals missing dates.")
    
    count = 0
    for s in targets:
        d = extract_date_heuristic(s.get("content", ""))
        if d:
            print(f"✅ {s['id'][:8]} -> {d}")
            db_client.mark_signal_processed(s['id'], article_date=d)
            count += 1
        else:
            # print(f"❌ {s['id'][:8]} - No match")
            pass
            
    print(f"Backfill Complete. Fixed {count} / {len(targets)} signals.")

if __name__ == "__main__":
    run_fix()
