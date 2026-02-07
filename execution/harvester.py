import os
import time
import logging
from dotenv import load_dotenv
from firecrawl import FirecrawlApp
import db_client

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables
load_dotenv()

import free_scraper

# ...

def do_the_work():
    """
    Main scraping logic.
    """
    # 1. Initialize (Local Scraper doesn't need API Key check here)
    # 

    # 2. Get Next Source to Scrape
    url, source_id = db_client.get_next_source()
    
    if not url:
        logging.info("No sources to scrape. Sleeping...")
        time.sleep(10)
        return

    logging.info(f"Scraping: {url} (ID: {source_id})")

    # 3. Scrape using Free Scraper
    try:
        # Using free_scraper.run_scrape
        markdown_content = free_scraper.run_scrape(url)
        
        # 4. Save to InstantDB
        if markdown_content:
            logging.info(f"Scraped {len(markdown_content)} bytes. Saving to DB...")
            
            db_client.add_raw_signal(source_id, markdown_content)
            
            # 5. Update Source Timestamp
            db_client.update_source_timestamp(source_id)
            logging.info("Source updated.")
        else:
            logging.warning(f"No markdown content found for {url}")
            db_client.update_source_timestamp(source_id)

    except Exception as e:
        logging.error(f"Scraper Error: {e}")
        time.sleep(5)

def main():
    print("Ralph is running: THE HARVESTER")
    while True:
        try:
            do_the_work()
        except KeyboardInterrupt:
            print("Stopping...")
            break
        except Exception as e:
            logging.error(f"CRITICAL LOOP ERROR: {e}")
            time.sleep(10)

if __name__ == "__main__":
    main()
