import os
import time
import logging
import random
from urllib.parse import urlparse
from dotenv import load_dotenv
from serpapi.google_search import GoogleSearch
from firecrawl import FirecrawlApp
import db_client

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

import free_scraper

# Configuration for National Scout
CITIES = [
    "New York, NY", "Miami, FL", "Los Angeles, CA", "Chicago, IL", "Austin, TX", 
    "San Francisco, CA", "Seattle, WA", "Boston, MA", "Denver, CO", "Nashville, TN"
]

TERMS = [
    "new condo tower", "luxury high rise news", "proposed skyscraper", 
    "construction update", "groundbreaking real estate", "large development project"
]

def validate_source_content(url):
    """
    Validates the source by visiting it with Local Scraper and checking for keywords.
    Returns True if valid, False otherwise.
    """
    try:
        logging.info(f"Validating {url} with Local Scraper...")
        # Scrape the page
        markdown = free_scraper.run_scrape(url)
        
        if not markdown:
            logging.warning(f"Validation failed: No content returned for {url}")
            return False
            
        content = markdown.lower()
        
        # Simple keyword check
        keywords = ["real estate", "development", "properties", "luxury", "news", "project", "condo", "apartment", "building"]
        
        hit_count = sum(1 for k in keywords if k in content)
        
        if hit_count >= 2:
            logging.info(f"Validation Passed: {url} (Keywords found: {hit_count})")
            return True
        else:
            logging.warning(f"Validation Failed: {url} (Low keyword relevance: {hit_count})")
            return False

    except Exception as e:
        logging.warning(f"Validation Error for {url}: {e}")
        return False

def do_the_work():
    """
    Scout Logic: National Search -> Root Extraction -> Validation -> Add.
    """
    serp_key = os.getenv("SERPAPI_KEY")
    if not serp_key:
        logging.error("SERPAPI_KEY not found.")
        time.sleep(30)
        return

    # 1. Random Selection
    city = random.choice(CITIES)
    term = random.choice(TERMS)
    
    query = f'{term} {city} -site:therealdeal.com -site:bizjournals.com'
    logging.info(f"Scout (SerpAPI) searching: {query}")
    
    params = {
        "engine": "google",
        "q": query,
        "api_key": serp_key,
        "num": 10
    }
    
    try:
        search = GoogleSearch(params)
        results = search.get_dict()
        organic_results = results.get("organic_results", [])
        
        # Shuffle results to avoid bias to top 1 if we loop fast
        random.shuffle(organic_results)
        
        found_new = False
        
        for result in organic_results:
            link = result.get("link")
            if not link:
                continue
            
            # 2. Root Domain Enforcement
            try:
                parsed = urlparse(link)
                root_domain = f"{parsed.scheme}://{parsed.netloc}"
            except Exception as e:
                logging.warning(f"Failed to parse URL {link}: {e}")
                continue
                
            # 3. Check Exists
            if db_client.check_source_exists(root_domain):
                # logging.info(f"Known source: {root_domain}")
                continue
                
            # 4. New Domain Discovery
            logging.info(f"Discovered [New Domain] {root_domain} (Root)")
            
            # 5. Validation & Add
            if validate_source_content(root_domain):
                db_client.add_source(root_domain)
                logging.info(f"-> Adding to DB: {root_domain}")
                found_new = True
                
                # Pace inserts and don't add too many per query to spread diversity
                # Break after finding one or two? Let's try to find at least one.
                time.sleep(10) 
                
            if found_new:
                # If we found something, maybe break to rotate query? 
                # Or keep going? Let's process a few.
                pass
            
    except Exception as e:
        logging.error(f"SerpAPI/Scout Error: {e}")
        
    # Sleep
    logging.info("Scout sleeping for 5 minutes...") 
    time.sleep(300)

def main():
    print("Ralph is running: THE SCOUT (NATIONAL)")
    while True:
        try:
            do_the_work()
        except KeyboardInterrupt:
            print("Stopping...")
            break
        except Exception as e:
            logging.error(f"CRITICAL SCOUT ERROR: {e}")
            time.sleep(60)

if __name__ == "__main__":
    main()
