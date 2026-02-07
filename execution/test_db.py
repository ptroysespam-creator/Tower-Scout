from db_client import query_db
import random
import datetime

def main():
    print("Fetching all sources from InstantDB...")
    
    # Query to fetch all sources
    query = {
        "sources": {}
    }
    
    data = query_db(query)
    
    if not data or "sources" not in data:
        print("FAILED: No data returned from database.")
        return

    sources = data["sources"]
    count = len(sources)
    print(f"Total Sources Found: {count}")
    
    if count == 0:
        print("No sources to sample.")
        return

    # Random Spot Check
    print("\n--- Random Spot Check ---")
    random_source = random.choice(sources)
    
    # Extract details
    s_id = random_source.get("id", "N/A")
    url = random_source.get("url", "N/A")
    name = random_source.get("name", "N/A") # Assuming 'name' field exists, else N/A
    last_crawled_ts = random_source.get("last_crawled")
    
    # Format timestamp if valid
    last_crawled_fmt = "Never"
    if last_crawled_ts:
        try:
            # Timestamp is likely ms based on previous code
            dt = datetime.datetime.fromtimestamp(last_crawled_ts / 1000.0)
            last_crawled_fmt = dt.strftime('%Y-%m-%d %H:%M:%S')
        except:
            last_crawled_fmt = str(last_crawled_ts)

    print(f"Source Name: {name}")
    print(f"URL: {url}")
    print(f"ID: {s_id}")
    print(f"Last Crawled: {last_crawled_fmt}")

if __name__ == "__main__":
    main()
