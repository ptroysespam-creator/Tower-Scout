"""
The Enricher - Gemini 1.5 Flash (Stable)
Processes raw signals with Google Gemini for AI extraction.
Rate limited to 15 requests/minute (4s sleep).
"""
import os
import time
import json
import re
import logging
from dotenv import load_dotenv
from google import genai
import db_client

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

# Load environment variables
load_dotenv()

# Configure Gemini
client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

SYSTEM_PROMPT = """STRICT FILTERING RULE: You are looking ONLY for 'High-Rise Residential', 'Condo', 'Mixed-Use with Residential', or 'Luxury Hospitality' projects.
- DISCARD any project that is purely Commercial, Retail (e.g., Amazon Fresh, Target, standalone stores), Industrial, or Single Family Homes.
- If the text describes a retail store WITHOUT a residential tower component, return {"project_name": null}.
- If valid, extract the JSON below.

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
  "address": string,
  "article_date": string
}

Return ONLY valid JSON, no markdown code blocks."""


def extract_json_from_response(text):
    """Extract JSON from Gemini response, handling markdown code blocks."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()
    
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except:
                pass
        return None


def do_the_work():
    """Main enrichment logic using Gemini 1.5 Flash."""
    
    # Get Unprocessed Signals Batch
    signals = db_client.get_unprocessed_signals(limit=10)
    
    if not signals:
        logging.info("No unprocessed signals. Sleeping...")
        time.sleep(10)
        return

    logging.info(f"Fetched batch of {len(signals)} signals. Processing...")

    for i, signal in enumerate(signals):
        signal_id = signal['id']
        content = signal.get('content', '')
        source_url = signal.get("source_url", "Unknown URL")
        
        logging.info(f"[{i+1}/{len(signals)}] Processing signal {signal_id[:8]}...")

        # Skip empty or tiny content
        if not content or len(content) < 100:
            db_client.mark_signal_processed(signal_id)
            logging.info(f"Skipped tiny signal {signal_id[:8]}...")
            continue
        
        # Truncate to avoid token limits (Gemini 1.5 Flash supports up to 1M tokens but we limit for speed)
        content = content[:25000]
        
        try:
            # Call Gemini 1.5 Flash (Stable)
            prompt = f"{SYSTEM_PROMPT}\n\n---\n\nTEXT TO ANALYZE:\n{content}"
            
            response = client.models.generate_content(
                model='gemini-flash-latest',
                contents=prompt
            )
            
            result_text = response.text
            result_data = extract_json_from_response(result_text)
            
            if not result_data:
                logging.warning(f"Failed to parse JSON from response")
                db_client.mark_signal_processed(signal_id)
                time.sleep(4) # Rate limit
                continue
            
            project_name = result_data.get("project_name")
            
            if project_name:
                logging.info(f"[Success] Extracted: {project_name}")
                
                # Build project record
                stats = result_data.get("stats") or {}
                project_record = {
                    "name": project_name,
                    "developer": result_data.get("developer"),
                    "architect": result_data.get("architect"),
                    "lender": result_data.get("lender"),
                    "sales_team": result_data.get("sales_team"),
                    "key_people": result_data.get("key_people"),
                    "gdv": stats.get("gdv"),
                    "stories": stats.get("floors"),
                    "units": stats.get("units"),
                    "delivery_date": stats.get("delivery_date"),
                    "unit_mix": result_data.get("unit_mix"),
                    "status_stage": result_data.get("status_stage"),
                    "signal_type": result_data.get("signal_type"),
                    "image_url": result_data.get("image_url"),
                    "address": result_data.get("address"),
                    "source_signal_id": signal_id,
                    "source_url": source_url,
                    "created_at": int(time.time() * 1000)
                }
                
                # Save to DB and link
                _, project_id = db_client.upsert_project(project_record)
                db_client.link_project_signal(project_id, signal_id)
                logging.info(f"[Success] Saved & Linked: {project_name}")
                
            else:
                logging.info(f"No residential project found (filtered out).")
            
            # Mark processed and save article date
            date_update = {}
            if result_data.get("article_date"):
                date_update["article_date"] = result_data.get("article_date")
            
            db_client.mark_signal_processed(signal_id, **date_update)
            
            # Rate limit inside the loop
            time.sleep(10)
            
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower() or "RESOURCE_EXHAUSTED" in error_str:
                logging.warning(f"Rate Limit Hit, sleeping 60s...")
                time.sleep(60)
            else:
                logging.error(f"Gemini Error: {e}")
                db_client.mark_signal_processed(signal_id)
                time.sleep(2)


def main():
    print("=" * 60)
    print("   THE ENRICHER (GEMINI 1.5 FLASH - STABLE)")
    print("   Batch Process: 10 signals per cycle")
    print("=" * 60)
    
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("❌ GOOGLE_API_KEY not found in .env")
        return
    
    print(f"✅ Gemini 1.5 Flash configured")
    print(f"✅ Rate limit: 10s pause (conservative)")
    print(f"✅ Residential filter: ACTIVE")
    print()
    
    while True:
        try:
            do_the_work()
            # Loop immediately to fetch next batch if there are more
        except KeyboardInterrupt:
            print("\nStopping...")
            break
        except Exception as e:
            logging.error(f"CRITICAL ERROR: {e}")
            time.sleep(10)

if __name__ == "__main__":
    main()
