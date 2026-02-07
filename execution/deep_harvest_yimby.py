"""
OPERATION DEEP DREDGE - Florida YIMBY Archive Harvester
Scrapes historical pages from floridayimby.com's archive.
Filters for 2024/2025 articles, deduplicates, and saves full content.
"""
import time
import re
import requests
from bs4 import BeautifulSoup
from db_client import query_db, transact_db
import uuid

# Configuration
BASE_URL = "https://floridayimby.com/page/{}"
MAX_PAGES = 20
MIN_CONTENT_LENGTH = 500
FETCH_DELAY = 2  # seconds between article fetches

# User-Agent to avoid blocks
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}


def get_existing_urls():
    """Fetches all existing URLs in raw_signals for deduplication."""
    query = {"raw_signals": {}}
    data = query_db(query)
    
    if not data or "raw_signals" not in data:
        return set()
    
    urls = set()
    for signal in data["raw_signals"]:
        url = signal.get("url", "")
        if url:
            urls.add(url.rstrip("/"))
    
    print(f"📊 Loaded {len(urls)} existing URLs for deduplication")
    return urls


def is_valid_year(url):
    """Checks if URL contains /2024/, /2025/, or /2026/ (recent articles only)."""
    return "/2024/" in url or "/2025/" in url or "/2026/" in url


def extract_article_links(page_html):
    """Extracts article links from a page listing."""
    soup = BeautifulSoup(page_html, "html.parser")
    links = []
    
    # Primary selector: h2 > a
    for h2 in soup.select("h2.entry-title a"):
        href = h2.get("href")
        if href:
            links.append(href)
    
    # Fallback: article header links
    if not links:
        for article in soup.select("article a[rel='bookmark']"):
            href = article.get("href")
            if href and href not in links:
                links.append(href)
    
    return links


def fetch_page(url):
    """Fetches a page with error handling."""
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"❌ Failed to fetch {url}: {e}")
        return None


def extract_article_content(html):
    """Extracts the main article content from an article page."""
    soup = BeautifulSoup(html, "html.parser")
    
    # Try entry-content first
    content_div = soup.select_one("div.entry-content")
    if not content_div:
        # Fallback to article tag
        content_div = soup.select_one("article")
    
    if not content_div:
        return None
    
    # Get clean text
    # Remove script/style elements
    for element in content_div.select("script, style, nav, footer, .sharedaddy, .jp-relatedposts"):
        element.decompose()
    
    text = content_div.get_text(separator="\n", strip=True)
    return text


def save_signal(url, content, source="floridayimby.com"):
    """Saves a new raw signal to the database."""
    signal_id = str(uuid.uuid4())
    now_ts = int(time.time() * 1000)
    
    tx_steps = [
        [
            "update", "raw_signals", signal_id,
            {
                "url": url,
                "content": content,
                "source": source,
                "processed": False,
                "created_at": now_ts
            }
        ]
    ]
    
    result = transact_db(tx_steps)
    return result is not None


def run_deep_harvest():
    """Main harvesting loop."""
    print("🚀 OPERATION DEEP DREDGE - Florida YIMBY Archive Harvester")
    print("=" * 60)
    
    # Load existing URLs for deduplication
    existing_urls = get_existing_urls()
    
    total_new = 0
    total_skipped = 0
    total_old_year = 0
    
    for page_num in range(1, MAX_PAGES + 1):
        page_url = BASE_URL.format(page_num)
        print(f"\n📄 Processing Page {page_num}/{MAX_PAGES}: {page_url}")
        
        page_html = fetch_page(page_url)
        if not page_html:
            print(f"⚠️ Skipping page {page_num} (fetch failed)")
            continue
        
        article_links = extract_article_links(page_html)
        print(f"   Found {len(article_links)} article links")
        
        page_new = 0
        
        for article_url in article_links:
            normalized_url = article_url.rstrip("/")
            
            # Filter by year
            if not is_valid_year(normalized_url):
                total_old_year += 1
                continue
            
            # Deduplicate
            if normalized_url in existing_urls:
                total_skipped += 1
                print(f"   ⏭️ Skipping (exists): {normalized_url[:60]}...")
                continue
            
            # Fetch full article content
            print(f"   📖 Fetching: {normalized_url[:60]}...")
            article_html = fetch_page(normalized_url)
            
            if not article_html:
                continue
            
            content = extract_article_content(article_html)
            
            if not content:
                print(f"   ⚠️ Warning: No content extracted from {normalized_url}")
                continue
            
            # Content quality check
            if len(content) < MIN_CONTENT_LENGTH:
                print(f"   ⚠️ Warning: Short content found ({len(content)} chars). Check selectors.")
            
            # Save to database
            if save_signal(normalized_url, content, "floridayimby.com"):
                existing_urls.add(normalized_url)  # Add to local cache
                total_new += 1
                page_new += 1
                print(f"   ✅ Saved ({len(content)} chars)")
            else:
                print(f"   ❌ Failed to save signal")
            
            # Pacing to avoid IP bans
            time.sleep(FETCH_DELAY)
        
        print(f"   📊 Page {page_num} summary: {page_new} new articles saved")
        
        # Small delay between pages too
        time.sleep(1)
    
    # Final summary
    print("\n" + "=" * 60)
    print("🏁 OPERATION DEEP DREDGE COMPLETE")
    print(f"   ✅ New articles saved: {total_new}")
    print(f"   ⏭️ Duplicates skipped: {total_skipped}")
    print(f"   📅 Old articles filtered (not 2024/2025): {total_old_year}")
    print("=" * 60)
    print("\n💡 Next step: Run `python3 execution/swarm_pipeline.py` to enrich the new signals!")


if __name__ == "__main__":
    run_deep_harvest()
