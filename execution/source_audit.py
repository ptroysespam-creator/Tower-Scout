"""
The Scout Commander - Source Audit
Verifies all sources are being crawled and identifies stale sources.
Triggers immediate re-crawl for sources that haven't been seen in >48h.
"""
import time
import logging
from datetime import datetime, timedelta
import db_client

# Setup logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(message)s'
)

# Stale threshold: 48 hours
STALE_THRESHOLD_HOURS = 48


def get_all_sources():
    """Fetch all sources from the database."""
    query = {"sources": {}}
    data = db_client.query_db(query)
    
    if not data or "sources" not in data:
        return []
    
    return data["sources"]


def get_latest_signal_for_source(source_id):
    """Get the most recent raw_signal for a source."""
    query = {"raw_signals": {}}
    data = db_client.query_db(query)
    
    if not data or "raw_signals" not in data:
        return None
    
    signals = data["raw_signals"]
    
    # Filter signals for this source and find the latest
    source_signals = [s for s in signals if s.get("source_id") == source_id]
    
    if not source_signals:
        return None
    
    # Sort by created_at descending
    sorted_signals = sorted(source_signals, key=lambda s: s.get("created_at", 0), reverse=True)
    return sorted_signals[0] if sorted_signals else None


def get_domain_from_url(url):
    """Extract domain from URL."""
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return parsed.netloc or url
    except:
        return url


def format_time_ago(timestamp_ms):
    """Format timestamp as 'X ago'."""
    if not timestamp_ms:
        return "Never"
    
    now = datetime.now()
    then = datetime.fromtimestamp(timestamp_ms / 1000)
    delta = now - then
    
    if delta.days > 0:
        return f"{delta.days} days ago"
    elif delta.seconds >= 3600:
        hours = delta.seconds // 3600
        return f"{hours}h ago"
    elif delta.seconds >= 60:
        minutes = delta.seconds // 60
        return f"{minutes}m ago"
    else:
        return "Just now"


def is_stale(timestamp_ms):
    """Check if a timestamp is older than the stale threshold."""
    if not timestamp_ms:
        return True
    
    now = datetime.now()
    then = datetime.fromtimestamp(timestamp_ms / 1000)
    threshold = timedelta(hours=STALE_THRESHOLD_HOURS)
    
    return (now - then) > threshold


def run_audit():
    """Run the source audit and print report."""
    print("=" * 70)
    print("   THE SCOUT COMMANDER - SOURCE AUDIT")
    print("   Checking coverage of all sources...")
    print("=" * 70)
    print()
    
    sources = get_all_sources()
    
    if not sources:
        print("⚠️  No sources found in database!")
        return
    
    print(f"📊 Total Sources: {len(sources)}")
    print("-" * 70)
    print()
    
    healthy_count = 0
    stale_count = 0
    never_crawled_count = 0
    stale_sources = []
    
    for source in sources:
        source_id = source.get("id")
        url = source.get("url", "Unknown")
        domain = get_domain_from_url(url)
        last_crawled = source.get("last_crawled")
        
        # Check the last signal from this source
        latest_signal = get_latest_signal_for_source(source_id)
        signal_time = latest_signal.get("created_at") if latest_signal else None
        
        # Use the more recent of last_crawled or latest signal
        effective_time = max(last_crawled or 0, signal_time or 0)
        
        time_ago = format_time_ago(effective_time)
        
        if effective_time == 0:
            never_crawled_count += 1
            print(f"🔴 {domain}: Never crawled")
            stale_sources.append((source_id, url))
        elif is_stale(effective_time):
            stale_count += 1
            print(f"⚠️  {domain}: Last seen {time_ago} (STALE)")
            stale_sources.append((source_id, url))
        else:
            healthy_count += 1
            print(f"✅ {domain}: Last seen {time_ago}")
    
    print()
    print("-" * 70)
    print(f"📊 SUMMARY:")
    print(f"   ✅ Healthy:      {healthy_count}")
    print(f"   ⚠️  Stale (>48h): {stale_count}")
    print(f"   🔴 Never crawled: {never_crawled_count}")
    print("-" * 70)
    
    # Re-queue stale sources by resetting their last_crawled to None
    if stale_sources:
        print()
        print(f"🔄 RE-QUEUEING {len(stale_sources)} stale sources...")
        
        for source_id, url in stale_sources[:10]:  # Limit to 10 to avoid overwhelming
            domain = get_domain_from_url(url)
            
            # Reset last_crawled to None to prioritize this source
            steps = [
                ["update", "sources", source_id, {"last_crawled": None}]
            ]
            result = db_client.transact_db(steps)
            
            if result:
                print(f"   📌 Re-queued: {domain}")
            else:
                print(f"   ❌ Failed to re-queue: {domain}")
        
        if len(stale_sources) > 10:
            print(f"   ... and {len(stale_sources) - 10} more will be handled in next audit")
    
    print()
    print("✅ Audit complete. Run harvester.py to crawl re-queued sources.")


def main():
    run_audit()


if __name__ == "__main__":
    main()
