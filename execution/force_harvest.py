"""
Force Harvest - Re-crawl Stale Sources
Immediately feeds stale URLs found by the Source Audit into the harvester.
"""
import time
import logging
from dotenv import load_dotenv
import db_client

# Try to import scraper
try:
    import free_scraper
    HAS_SCRAPER = True
except ImportError:
    HAS_SCRAPER = False

# Setup logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(message)s'
)

load_dotenv()

# STALE SOURCES - Identified by Source Audit
STALE_URLS = [
    "https://therealdeal.com/miami/",
    "https://therealdeal.com/new-york/",
    "https://www.bisnow.com/south-florida",
    "https://www.bisnow.com/new-york",
    "https://newyorkyimby.com/",
    "https://floridayimby.com/",
    "https://miami.urbanize.city/",
    "https://ny.curbed.com/",
    "https://miami.curbed.com/",
    "https://commercialobserver.com/",
    "https://www.connectcre.com/",
    "https://www.miamitimesonline.com/",
]


def find_source_by_url(url):
    """Find source ID by URL."""
    query = {"sources": {}}
    data = db_client.query_db(query)
    
    if not data or "sources" not in data:
        return None
    
    normalized = url.rstrip("/")
    for source in data["sources"]:
        source_url = source.get("url", "").rstrip("/")
        if normalized in source_url or source_url in normalized:
            return source.get("id"), source.get("url")
    
    return None, None


def harvest_url(url):
    """Scrape a URL and save to raw_signals."""
    if not HAS_SCRAPER:
        logging.warning(f"⚠️  Scraper not available, marking for queue only")
        return False
    
    try:
        logging.info(f"🔄 Re-crawling: {url}")
        markdown_content = free_scraper.run_scrape(url)
        
        if markdown_content and len(markdown_content) > 100:
            # Find source ID
            source_id, _ = find_source_by_url(url)
            
            if source_id:
                db_client.add_raw_signal(source_id, markdown_content)
                db_client.update_source_timestamp(source_id)
                logging.info(f"✅ Harvested {len(markdown_content)} bytes from {url}")
                return True
            else:
                logging.warning(f"⚠️  Source not found in DB for {url}")
        else:
            logging.warning(f"⚠️  No content from {url}")
            
    except Exception as e:
        logging.error(f"❌ Error harvesting {url}: {e}")
    
    return False


def reset_stale_sources():
    """Reset last_crawled for stale sources to prioritize them."""
    logging.info("📋 Resetting stale sources to prioritize in queue...")
    
    for url in STALE_URLS:
        source_id, actual_url = find_source_by_url(url)
        
        if source_id:
            # Reset last_crawled to None to prioritize
            steps = [["update", "sources", source_id, {"last_crawled": None}]]
            result = db_client.transact_db(steps)
            
            if result:
                logging.info(f"  📌 Queued: {actual_url}")
            else:
                logging.warning(f"  ❌ Failed to queue: {url}")
        else:
            logging.warning(f"  ⚠️  Not in DB: {url}")
        
        time.sleep(0.5)


def main():
    print("=" * 60)
    print("   FORCE HARVEST - STALE SOURCE RECOVERY")
    print(f"   Processing {len(STALE_URLS)} stale sources")
    print("=" * 60)
    print()
    
    # Option 1: Reset sources to be picked up by harvester
    reset_stale_sources()
    
    print()
    print("=" * 60)
    print("✅ Stale sources queued for harvester.py")
    print("   Run harvester.py to process them immediately.")
    print("=" * 60)


if __name__ == "__main__":
    main()
