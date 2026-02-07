import os
import time
import json
import logging
import uuid
from groq import Groq
import db_client
import free_scraper

# Load .env manually
from pathlib import Path
env_path = Path(__file__).parent.parent / '.env'
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key] = value

SYSTEM_PROMPT = """You are a Real Estate Intelligence Officer. Analyze the text and extract the following JSON. Be precise. If a field is not found, use null.

{
  "project_name": string,
  "developer": string,
  "architect": string,
  "lender": string,
  "sales_team": string,
  "key_people": [string],
  "stats": {
    "gdv": string,
    "floors": int,
    "units": int,
    "delivery_date": string
  },
  "unit_mix": [{"type": string, "count": int, "price": string}],
  "status_stage": string,
  "signal_type": string,
  "image_url": string,
  "address": string
}"""

# High-value real estate news sources
URLS = [
    "https://therealdeal.com/miami/2024/12/15/one-park-tower-brickell/",
    "https://therealdeal.com/miami/2024/10/02/pmg-breaks-ground-on-downtown-miami-tower/",
    "https://therealdeal.com/new-york/2024/11/05/extell-unveils-central-park-tower/",
    "https://therealdeal.com/miami/2024/09/18/related-group-launches-residences-at-1428-brickell/",
    "https://www.bisnow.com/miami/news/commercial-real-estate/miami-developer-launches-newest-tower-project-132847",
    "https://ny.curbed.com/2024/8/12/brooklyn-tower-breaks-ground",
    "https://urbanize.city/la/post/century-city-tower-development",
    "https://sfyimby.com/2024/10/san-francisco-office-tower-plans-filed",
]

def main():
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        print("❌ Missing GROQ_API_KEY")
        return

    client = Groq(api_key=groq_key)
    saved_count = 0

    for url in URLS:
        print(f"\n{'='*50}")
        print(f"Processing: {url}")
        print("="*50)
        
        try:
            # Scrape
            markdown = free_scraper.run_scrape(url)
            if not markdown:
                print("❌ Empty scrape")
                continue
            print(f"✅ Scraped {len(markdown)} bytes")
            
            # Enrich
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": markdown[:15000]}
                ],
                temperature=0,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(completion.choices[0].message.content)
            p_name = result.get('project_name')
            
            if not p_name:
                print("❌ No project name found")
                continue
                
            print(f"✅ Extracted: {p_name}")
            print(f"   Developer: {result.get('developer')}")
            print(f"   GDV: {result.get('stats', {}).get('gdv')}")
            print(f"   Units: {result.get('stats', {}).get('units')}")
            
            # Save to DB
            project_id = str(uuid.uuid4())
            project_record = {
                "name": p_name,
                "developer": result.get("developer"),
                "architect": result.get("architect"),
                "lender": result.get("lender"),
                "sales_team": result.get("sales_team"),
                "key_people": result.get("key_people"),
                "gdv": result.get("stats", {}).get("gdv"),
                "stories": result.get("stats", {}).get("floors"),
                "units": result.get("stats", {}).get("units"),
                "delivery_date": result.get("stats", {}).get("delivery_date"),
                "unit_mix": result.get("unit_mix"),
                "status_stage": result.get("status_stage"),
                "signal_type": result.get("signal_type"),
                "image_url": result.get("image_url"),
                "address": result.get("address"),
                "source_url": url,
                "created_at": int(time.time() * 1000)
            }
            
            db_client.transact_db([
                ["update", "projects", project_id, project_record]
            ])
            print(f"✅ Saved: {p_name}")
            saved_count += 1
            
            time.sleep(2)  # Rate limit respect
            
        except Exception as e:
            print(f"❌ Error: {e}")
            time.sleep(2)

    print(f"\n{'='*50}")
    print(f"BULK PROCESSING COMPLETE: {saved_count} projects saved")
    print("="*50)

if __name__ == "__main__":
    main()
