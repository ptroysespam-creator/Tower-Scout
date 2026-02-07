"""
UNIVERSAL DREDGER - Deep Archive Harvester for ALL Sources
Iterates through sources table and applies deep crawl heuristics:
- Pagination patterns (page/N, ?page=N)
- Sitemap extraction
- Full-text article fetching with deduplication
"""
import time
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from db_client import query_db, transact_db
import uuid
import xml.etree.ElementTree as ET

# Configuration
MAX_ARCHIVE_PAGES = 10
MIN_CONTENT_LENGTH = 500
FETCH_DELAY = 2  # seconds between article fetches
PAGE_DELAY = 1   # seconds between archive pages

# User-Agent to avoid blocks
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# URLs to ignore (navigation, legal pages, etc.)
IGNORE_PATTERNS = [
    "/contact", "/about", "/login", "/privacy", "/terms",
    "/advertise", "/subscribe", "/newsletter", "/tag/",
    "/category/", "/author/", "/wp-admin", "/wp-login",
    "/feed/", "/rss", "/sitemap", "/search"
]


def get_all_sources():
    """Fetches all sources from the database."""
    query = {"sources": {}}
    data = query_db(query)
    
    if not data or "sources" not in data:
        return []
    
    sources = data["sources"]
    print(f"📊 Loaded {len(sources)} sources from database")
    return sources


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


def should_ignore_url(url):
    """Checks if URL matches ignore patterns."""
    url_lower = url.lower()
    for pattern in IGNORE_PATTERNS:
        if pattern in url_lower:
            return True
    return False


def is_valid_year(url):
    """Checks if URL contains /2024/, /2025/, or /2026/ (recent articles only)."""
    return "/2024/" in url or "/2025/" in url or "/2026/" in url


def normalize_base_url(url):
    """Ensures URL has proper format."""
    if not url:
        return None
    url = url.strip()
    if not url.startswith("http"):
        url = "https://" + url
    return url.rstrip("/")


def fetch_page(url, timeout=15):
    """Fetches a page with error handling."""
    try:
        response = requests.get(url, headers=HEADERS, timeout=timeout)
        if response.status_code == 404:
            return None  # Silent 404s
        response.raise_for_status()
        return response.text
    except requests.RequestException:
        return None


def generate_archive_targets(base_url):
    """
    Generates archive page URLs using multiple heuristics.
    Returns list of (url, pattern_type) tuples.
    """
    targets = []
    
    # Pattern A: /page/N/ (WordPress style)
    for i in range(1, MAX_ARCHIVE_PAGES + 1):
        targets.append((f"{base_url}/page/{i}/", "page_path"))
    
    # Pattern B: ?page=N (Query param style)
    for i in range(1, MAX_ARCHIVE_PAGES + 1):
        targets.append((f"{base_url}/?page={i}", "page_query"))
    
    # Pattern C: Sitemap
    targets.append((f"{base_url}/sitemap.xml", "sitemap"))
    targets.append((f"{base_url}/sitemap_index.xml", "sitemap"))
    targets.append((f"{base_url}/post-sitemap.xml", "sitemap"))
    
    return targets


def extract_links_from_html(html, base_url):
    """Extracts article links from HTML page."""
    soup = BeautifulSoup(html, "html.parser")
    links = set()
    
    parsed_base = urlparse(base_url)
    base_domain = parsed_base.netloc.replace("www.", "")
    
    # Find all links
    for a_tag in soup.find_all("a", href=True):
        href = a_tag.get("href")
        if not href:
            continue
        
        # Resolve relative URLs
        full_url = urljoin(base_url, href)
        parsed = urlparse(full_url)
        
        # Only same domain
        link_domain = parsed.netloc.replace("www.", "")
        if base_domain not in link_domain and link_domain not in base_domain:
            continue
        
        # Skip non-http
        if not parsed.scheme.startswith("http"):
            continue
        
        # Skip ignored patterns
        if should_ignore_url(full_url):
            continue
        
        # Clean URL (remove fragments, trailing slash)
        clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/")
        
        # Skip homepage
        if clean_url == base_url:
            continue
        
        links.add(clean_url)
    
    return links


def extract_links_from_sitemap(xml_content, limit=500):
    """Extracts URLs from sitemap XML."""
    links = set()
    
    try:
        # Remove namespace for easier parsing
        xml_content = re.sub(r'\sxmlns="[^"]+"', '', xml_content)
        root = ET.fromstring(xml_content)
        
        # Handle sitemap index
        for sitemap in root.findall(".//sitemap"):
            loc = sitemap.find("loc")
            if loc is not None and loc.text:
                links.add(loc.text.strip())
        
        # Handle URL entries
        for url_elem in root.findall(".//url"):
            loc = url_elem.find("loc")
            if loc is not None and loc.text:
                url = loc.text.strip()
                if not should_ignore_url(url):
                    links.add(url)
                    if len(links) >= limit:
                        break
    except ET.ParseError:
        pass
    
    return links


def extract_article_content(html):
    """Extracts the main article content from an article page."""
    soup = BeautifulSoup(html, "html.parser")
    
    # Remove unwanted elements first
    for element in soup.select("script, style, nav, footer, header, aside, .sidebar, .comments, .sharedaddy, .jp-relatedposts, .related-posts, .advertisement, .ad-container"):
        element.decompose()
    
    # Try multiple content selectors in order of preference
    selectors = [
        "div.entry-content",
        "article .content",
        "div.post-content",
        "div.article-content",
        "div.story-content",
        "article",
        "main",
        "div.content"
    ]
    
    for selector in selectors:
        content_div = soup.select_one(selector)
        if content_div:
            text = content_div.get_text(separator="\n", strip=True)
            if len(text) >= MIN_CONTENT_LENGTH:
                return text
    
    # Last resort: body text
    body = soup.find("body")
    if body:
        text = body.get_text(separator="\n", strip=True)
        if len(text) >= MIN_CONTENT_LENGTH:
            return text
    
    return None


def save_signal(url, content, source):
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


def process_source(source, existing_urls):
    """Processes a single source with deep dredge heuristics."""
    source_url = source.get("url")
    if not source_url:
        return 0, 0
    
    base_url = normalize_base_url(source_url)
    if not base_url:
        return 0, 0
    
    parsed = urlparse(base_url)
    source_name = parsed.netloc.replace("www.", "")
    
    print(f"\n🔍 DREDGING: {source_name}")
    print(f"   Base URL: {base_url}")
    
    article_urls = set()
    pages_found = 0
    
    # Generate and process archive targets
    archive_targets = generate_archive_targets(base_url)
    
    for target_url, pattern_type in archive_targets:
        html = fetch_page(target_url, timeout=10)
        if not html:
            continue
        
        pages_found += 1
        
        if pattern_type == "sitemap":
            links = extract_links_from_sitemap(html)
            print(f"   📑 Sitemap: Found {len(links)} URLs")
        else:
            links = extract_links_from_html(html, base_url)
            if links:
                print(f"   📄 {pattern_type}: Found {len(links)} links")
        
        article_urls.update(links)
        time.sleep(0.5)  # Brief pause between archive pages
    
    if not article_urls:
        print(f"   ⚠️ No article URLs found")
        return 0, 0
    
    print(f"   📊 Total unique article URLs: {len(article_urls)}")
    
    # Filter for 2024/2025 articles only
    recent_urls = [url for url in article_urls if is_valid_year(url)]
    print(f"   📅 2024/2025 articles: {len(recent_urls)}")
    
    # Process articles
    new_count = 0
    skip_count = 0
    
    for article_url in recent_urls:
        normalized = article_url.rstrip("/")
        
        # Deduplicate
        if normalized in existing_urls:
            skip_count += 1
            continue
        
        # Fetch full content
        article_html = fetch_page(normalized)
        if not article_html:
            continue
        
        content = extract_article_content(article_html)
        if not content:
            continue
        
        if len(content) < MIN_CONTENT_LENGTH:
            print(f"   ⚠️ Warning: Short content ({len(content)} chars): {normalized[:50]}...")
            continue
        
        # Save to database
        if save_signal(normalized, content, source_name):
            existing_urls.add(normalized)
            new_count += 1
            # Extract title for logging
            title = normalized.split("/")[-1].replace("-", " ")[:40]
            print(f"   ✅ [{source_name}] Deep Harvest: Saved '{title}...'")
        
        time.sleep(FETCH_DELAY)
        
        # Status update every 10 new articles
        if new_count % 10 == 0 and new_count > 0:
            print(f"   📊 Progress: {new_count} new articles saved...")
    
    return new_count, skip_count


def run_universal_dredge():
    """Main universal dredging loop."""
    print("🚀 UNIVERSAL DREDGER - Deep Archive Harvester")
    print("=" * 70)
    print("Applying deep crawl heuristics to ALL sources")
    print("=" * 70)
    
    # Load sources and existing URLs
    sources = get_all_sources()
    if not sources:
        print("❌ No sources found in database!")
        return
    
    existing_urls = get_existing_urls()
    
    total_new = 0
    total_skipped = 0
    sources_processed = 0
    
    for source in sources:
        try:
            new_count, skip_count = process_source(source, existing_urls)
            total_new += new_count
            total_skipped += skip_count
            sources_processed += 1
            
            # Status update every 5 sources
            if sources_processed % 5 == 0:
                print(f"\n📊 PROGRESS: {sources_processed}/{len(sources)} sources | {total_new} new articles")
            
            time.sleep(PAGE_DELAY)
            
        except Exception as e:
            print(f"   ❌ Error processing source: {e}")
            continue
    
    # Final summary
    print("\n" + "=" * 70)
    print("🏁 UNIVERSAL DREDGE COMPLETE")
    print(f"   📁 Sources processed: {sources_processed}")
    print(f"   ✅ New articles saved: {total_new}")
    print(f"   ⏭️ Duplicates skipped: {total_skipped}")
    print("=" * 70)
    print("\n💡 Run `python3 execution/swarm_pipeline.py` in another terminal to enrich!")


if __name__ == "__main__":
    run_universal_dredge()
