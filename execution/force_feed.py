import os
import time
import json
import logging
from groq import Groq
from dotenv import load_dotenv
import db_client
import uuid
import free_scraper # Local Wrapper

# ... (rest of imports)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(message)s')

load_dotenv()

SYSTEM_PROMPT = """STRICT FILTERING RULE: You are looking ONLY for 'High-Rise Residential', 'Condo', 'Mixed-Use with Residential', or 'Luxury Hospitality' projects.
- DISCARD any project that is purely Commercial, Retail (e.g., Amazon Fresh, Target, standalone stores), Industrial, or Single Family Homes.
- If the text describes a retail store WITHOUT a residential tower component, return {"project_name": null}.
- If valid, extract the usual JSON below.

You are a Real Estate Intelligence Officer. Analyze the text and extract the following JSON. Be precise. If a field is not found, use null.

{
  "project_name": string,
  "developer": string,
  "architect": string,
  "lender": string (Look for 'loan', 'financing', 'mortgage'),
  "sales_team": string (Look for 'brokerage', 'sales launch', 'exclusive sales'),
  "key_people": [string] (Extract specific names of CEOs, Architects, or Brokers mentioned),
  "stats": {
    "gdv": string (Gross Development Value or Sellout, e.g., "$500M"),
    "floors": int,
    "units": int,
    "delivery_date": string (e.g., "2027", "Q4 2028")
  },
  "unit_mix": [
    {"type": string, "count": int, "price": string}
  ],
  "status_stage": string (Classify as: "Planning", "Permitting", "Groundbreaking", "Construction"),
  "signal_type": string (Classify the article as: "permit" (if zoning/gov), "financial" (if loan/bank), "general" (if news)),
  "image_url": string (Find the URL of the main architectural rendering. Do NOT pick headshots/ads.)
}"""

def force_feed():
    print("=" * 60)
    print("       FORCE FEED - LOCAL SCRAPE + GROQ ENRICH")
    print("=" * 60)
    
    # TEST URL - Data-Rich Article (Urbanize LA)
    url = "https://urbanize.city/la/post/holland-partner-group-breaks-ground-noho-apartments" 
    source_id = "manual-test-id"
    
    print(f"\n[1/4] TARGET: {url}\n")
    
    # 2. Scrape (Local)
    print("[2/4] SCRAPING with crawl4ai...")
    
    markdown = free_scraper.run_scrape(url)
    
    if not markdown:
        print("❌ Scrape returned empty content.")
        return
        
    print(f"✅ Scraped {len(markdown):,} bytes.\n")

    # 3. Enrich
    print("[3/4] ENRICHING with Groq (Llama 3.3)...")
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        print("❌ Missing Groq API Key.")
        return
        
    client = Groq(api_key=groq_key)
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": markdown[:15000]} # Truncate to avoid context limits
            ],
            temperature=0,
            response_format={"type": "json_object"}
        )
        
        result_json_str = completion.choices[0].message.content
        result_data = json.loads(result_json_str)
        
        p_name = result_data.get('project_name')
        if not p_name:
            print("❌ Enrichment returned null project name. Might be irrelevant article.")
            print(f"   Signal Type: {result_data.get('signal_type')}")
            return
        
        # DETAILED ENRICHMENT OUTPUT
        print(f"✅ Enriched: {p_name}")
        print("-" * 40)
        print(f"   Developer:     {result_data.get('developer')}")
        print(f"   Architect:     {result_data.get('architect')}")
        print(f"   Lender:        {result_data.get('lender')}")
        print(f"   Sales Team:    {result_data.get('sales_team')}")
        print(f"   GDV:           {result_data.get('stats', {}).get('gdv')}")
        print(f"   Floors:        {result_data.get('stats', {}).get('floors')}")
        print(f"   Units:         {result_data.get('stats', {}).get('units')}")
        print(f"   Delivery:      {result_data.get('stats', {}).get('delivery_date')}")
        print(f"   Stage:         {result_data.get('status_stage')}")
        print(f"   Signal Type:   {result_data.get('signal_type')}")
        print(f"   Key People:    {result_data.get('key_people')}")
        print(f"   Unit Mix:      {result_data.get('unit_mix')}")
        print("-" * 40)
        
    except Exception as e:
        print(f"❌ Enrichment failed: {e}")
        return
        
    # 4. Save
    print("\n[4/4] SAVING to InstantDB...")
    
    # Save Signal first
    s_id = str(uuid.uuid4())
    db_client.transact_db([
        ["update", "raw_signals", s_id, {
            "source_id": source_id,
            "content": markdown,
            "processed": True,
            "created_at": int(time.time() * 1000)
        }]
    ])
    
    # Save Project
    project_id = str(uuid.uuid4())
    project_record = {
        "name": p_name,
        "developer": result_data.get("developer"),
        "architect": result_data.get("architect"),
        "lender": result_data.get("lender"),
        "sales_team": result_data.get("sales_team"),
        "key_people": result_data.get("key_people"),
        "gdv": result_data.get("stats", {}).get("gdv"),
        "stories": result_data.get("stats", {}).get("floors"),
        "units": result_data.get("stats", {}).get("units"),
        "delivery_date": result_data.get("stats", {}).get("delivery_date"),
        "unit_mix": result_data.get("unit_mix"),
        "status_stage": result_data.get("status_stage"),
        "signal_type": result_data.get("signal_type"),
        "image_url": result_data.get("image_url"),
        "source_signal_id": s_id,
        "source_url": url,
        "created_at": int(time.time() * 1000)
    }
    
    db_client.transact_db([
        ["update", "projects", project_id, project_record]
    ])
    
    print("=" * 60)
    print(f"✅ SAVED: {p_name}")
    print(f"   GDV: {project_record.get('gdv')}  |  Dev: {project_record.get('developer')}")
    print("=" * 60)

if __name__ == "__main__":
    force_feed()
