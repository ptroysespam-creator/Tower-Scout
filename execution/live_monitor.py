"""
Live Monitor - 5 Minute Dashboard
Shows real-time pipeline status every 5 minutes.
"""
import time
import logging
from datetime import datetime
import db_client

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

# Track previous counts for delta
previous_counts = {
    "projects": 0,
    "geocoded": 0,
    "signals": 0
}


def get_stats():
    """Fetch all stats from DB."""
    stats = {
        "total_signals": 0,
        "processed_signals": 0,
        "unprocessed_signals": 0,
        "total_projects": 0,
        "geocoded_projects": 0,
        "ungeo_projects": 0
    }
    
    # Get raw_signals
    try:
        signal_query = {"raw_signals": {}}
        signal_data = db_client.query_db(signal_query)
        
        if signal_data and "raw_signals" in signal_data:
            signals = signal_data["raw_signals"]
            stats["total_signals"] = len(signals)
            stats["processed_signals"] = len([s for s in signals if s.get("processed") is True])
            stats["unprocessed_signals"] = stats["total_signals"] - stats["processed_signals"]
    except Exception as e:
        logging.warning(f"Signal query error: {e}")
    
    # Get projects
    try:
        project_query = {"projects": {}}
        project_data = db_client.query_db(project_query)
        
        if project_data and "projects" in project_data:
            projects = project_data["projects"]
            stats["total_projects"] = len(projects)
            
            # Count geocoded
            geocoded = 0
            for p in projects:
                coords = p.get("coordinates")
                loc = p.get("location")
                
                if coords and isinstance(coords, dict) and coords.get("lat") and coords.get("lng"):
                    geocoded += 1
                elif loc and isinstance(loc, dict) and loc.get("lat") and loc.get("lng"):
                    geocoded += 1
            
            stats["geocoded_projects"] = geocoded
            stats["ungeo_projects"] = stats["total_projects"] - geocoded
    except Exception as e:
        logging.warning(f"Project query error: {e}")
    
    return stats


def display_dashboard(stats):
    """Display a beautiful terminal dashboard."""
    global previous_counts
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Calculate deltas
    project_delta = stats["total_projects"] - previous_counts["projects"]
    geocoded_delta = stats["geocoded_projects"] - previous_counts["geocoded"]
    
    delta_str = ""
    if project_delta > 0:
        delta_str = f"(+{project_delta} new)"
    elif project_delta < 0:
        delta_str = f"({project_delta})"
    
    geo_delta_str = ""
    if geocoded_delta > 0:
        geo_delta_str = f"(+{geocoded_delta})"
    
    # Update previous
    previous_counts["projects"] = stats["total_projects"]
    previous_counts["geocoded"] = stats["geocoded_projects"]
    previous_counts["signals"] = stats["total_signals"]
    
    # Clear and print dashboard
    print("\n" * 2)
    print("=" * 60)
    print(f" 🏗️  TOWER SCOUT LIVE OPS - {timestamp}")
    print("=" * 60)
    print()
    
    # Signal backlog
    backlog = stats["unprocessed_signals"]
    if backlog > 0:
        print(f" 📉 Signal Backlog:    {backlog:,} (Processing...)")
    else:
        print(f" 📉 Signal Backlog:    ✅ Clear!")
    
    # Projects
    print(f" 🏗️  Active Projects:   {stats['total_projects']:,} {delta_str}")
    
    # Geocoded
    geo_pct = 0
    if stats["total_projects"] > 0:
        geo_pct = (stats["geocoded_projects"] / stats["total_projects"]) * 100
    print(f" 📍 Geocoded Map:      {stats['geocoded_projects']}/{stats['total_projects']} ({geo_pct:.0f}%) {geo_delta_str}")
    
    # AI Health
    print(f" 🤖 AI Health:         Gemini 1.5 Flash (Robust Mode)")
    
    print()
    print("-" * 60)
    print(f" 📊 Total Signals: {stats['total_signals']:,} | Processed: {stats['processed_signals']:,}")
    print("=" * 60)
    print()


def main():
    print("=" * 60)
    print("   LIVE MONITOR - 5 MINUTE DASHBOARD")
    print("   Monitoring pipeline health...")
    print("=" * 60)
    print()
    
    while True:
        try:
            stats = get_stats()
            display_dashboard(stats)
            
            # Wait 5 minutes (300 seconds)
            logging.info("Next update in 5 minutes...")
            time.sleep(300)
            
        except KeyboardInterrupt:
            print("\n🛑 Stopping Live Monitor...")
            break
        except Exception as e:
            logging.error(f"Monitor error: {e}")
            time.sleep(30)


if __name__ == "__main__":
    main()
