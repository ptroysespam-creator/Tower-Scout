"""
Batch Enricher - Process ALL unprocessed signals in a single run.
Uses Groq Llama 3.3 with rate limiting.
"""
import os
import time
import json
import logging
import uuid
import sys
from pathlib import Path

# Load .env manually
env_path = Path(__file__).parent.parent / '.env'
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key] = value

from groq import Groq
import db_client

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

SYSTEM_PROMPT = """STRICT FILTERING RULE: You are looking ONLY for 'High-Rise Residential', 'Condo', 'Mixed-Use with Residential', or 'Luxury Hospitality' projects.
- DISCARD any project that is purely Commercial, Retail (e.g., Amazon Fresh, Target, standalone stores), Industrial, or Single Family Homes.
- If the text describes a retail store WITHOUT a residential tower component, return {"project_name": null}.
- If valid, extract the usual JSON below.

You are a Real Estate Intelligence Officer. Analyze the text and extract the following JSON. Be precise. If a field is not found, use null.

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

def process_signal(client, signal):
    """Process a single signal."""
    signal_id = signal['id']
    content = signal.get('content', '')
    source_url = signal.get('source_url', 'Unknown')
    
    if not content or len(content) < 100:
        db_client.mark_signal_processed(signal_id)
        return None
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": content[:15000]}
            ],
            temperature=0,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(completion.choices[0].message.content)
        project_name = result.get("project_name")
        
        db_client.mark_signal_processed(signal_id)
        
        if project_name:
            project_id = str(uuid.uuid4())
            project_record = {
                "name": project_name,
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
                "source_signal_id": signal_id,
                "source_url": source_url,
                "created_at": int(time.time() * 1000)
            }
            
            db_client.transact_db([
                ["update", "projects", project_id, project_record]
            ])
            return project_name
            
    except Exception as e:
        if "429" in str(e) or "rate_limit" in str(e):
            logging.warning("Rate limit hit, sleeping 60s...")
            time.sleep(60)
            return "RATE_LIMIT"
        logging.error(f"Error: {e}")
        db_client.mark_signal_processed(signal_id)
    
    return None

def main():
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        print("❌ Missing GROQ_API_KEY")
        return
    
    client = Groq(api_key=groq_key)
    
    # Get all unprocessed signals
    data = db_client.query_db({'raw_signals': {}})
    all_signals = data.get('raw_signals', [])
    unprocessed = [s for s in all_signals if not s.get('processed', False)]
    
    total = len(unprocessed)
    print(f"\n{'='*60}")
    print(f"BATCH ENRICHER - Processing {total} unprocessed signals")
    print(f"{'='*60}\n")
    
    projects_found = 0
    processed = 0
    
    for i, signal in enumerate(unprocessed):
        result = process_signal(client, signal)
        processed += 1
        
        if result == "RATE_LIMIT":
            # Retry this signal
            continue
        elif result:
            projects_found += 1
            logging.info(f"[{processed}/{total}] ✅ {result}")
        else:
            if processed % 10 == 0:
                logging.info(f"[{processed}/{total}] Processed (no project found)")
        
        # Respect rate limits (30 requests/min on free tier)
        time.sleep(2)
    
    print(f"\n{'='*60}")
    print(f"COMPLETE: Processed {processed} signals, found {projects_found} projects")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
