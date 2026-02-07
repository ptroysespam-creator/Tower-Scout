"""
The Mass Enricher - Gemini 1.5 Flash (ROBUST MODE)
Continuously processes backlog of ~2,000 raw signals.
STRICT 15 RPM pacing with 4.5s sleep between ALL requests.
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
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(message)s',
    handlers=[
        logging.FileHandler('/Users/pablo/Downloads/Preconstruction Radar/mass_enricher.log'),
        logging.StreamHandler()
    ]
)

# Load environment variables
load_dotenv()

# Configure Gemini
client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

# Try multiple model names for compatibility
MODEL_OPTIONS = [
    'gemini-1.5-flash',
    'models/gemini-1.5-flash',
    'gemini-flash-latest',
    'gemini-2.0-flash'
]

SYSTEM_PROMPT = """You are a Real Estate Intelligence Analyst. Extract the following JSON from the text.
Be precise. If a field is not found, use null.

{
  "name": "Project Name (string)",
  "address": "Full address (Critical - string)",
  "city": "City Name (string)",
  "developer": "Developer Name (string)",
  "architect": "Architect Name (string)",
  "gdv": "Total Gross Development Value e.g. '$500M' (string)",
  "units": "Number of units (integer)",
  "floors": "Number of stories (integer)",
  "status_stage": "'Planning', 'Permitting', 'Construction', or 'Delivered' (string)",
  "individuals": ["List of specific names mentioned e.g. 'Jorge Perez', 'Michael Stern'"],
  "article_date": "Date of publication in YYYY-MM-DD format (string)"
}

CRITICAL FILTER RULES:
- If this is purely a Retail Store (e.g. Amazon Fresh, Target), return null.
- If this is a Single Family Home, return null.
- If this is irrelevant news (not real estate development), return null.
- Only extract Multi-Family, Condo, High-Rise, Mixed-Use (with residential), or Luxury Hospitality projects.

Return ONLY valid JSON. No markdown code blocks."""


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
    
    # Handle null response
    if text.lower() == "null":
        return None
    
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


def call_gemini_with_retry(prompt, max_retries=3):
    """Call Gemini with model fallback and retry logic."""
    
    for model_name in MODEL_OPTIONS:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            return response.text, model_name
        except Exception as e:
            error_str = str(e)
            if "404" in error_str:
                # Model not found, try next
                continue
            elif "429" in error_str or "quota" in error_str.lower() or "RESOURCE_EXHAUSTED" in error_str:
                # Rate limit - raise to handle in main loop
                raise e
            else:
                # Other error, try next model
                logging.warning(f"Model {model_name} error: {e}")
                continue
    
    raise Exception("All model options exhausted")


def do_the_work():
    """Main enrichment logic with STRICT 15 RPM pacing."""
    
    # Fetch batch of 10 unprocessed signals
    signals = db_client.get_unprocessed_signals(limit=10)
    
    if not signals:
        logging.info("📭 Pipeline Clear. Sleeping 60s...")
        time.sleep(60)
        return

    logging.info(f"📥 Fetched batch of {len(signals)} signals. Processing...")

    for i, signal in enumerate(signals):
        signal_id = signal['id']
        content = signal.get('content', '')
        source_url = signal.get("source_url", "Unknown")
        
        # Extract domain for logging
        try:
            from urllib.parse import urlparse
            domain = urlparse(source_url).netloc or "Unknown"
        except:
            domain = "Unknown"
        
        logging.info(f"[{i+1}/{len(signals)}] Processing from {domain}...")

        # Skip empty or tiny content
        if not content or len(content) < 100:
            db_client.mark_signal_processed(signal_id)
            logging.info(f"⏭️  Skipped tiny signal.")
            continue
        
        # Truncate to avoid token limits
        content = content[:25000]
        
        try:
            prompt = f"{SYSTEM_PROMPT}\n\n---\n\nTEXT TO ANALYZE:\n{content}"
            
            result_text, model_used = call_gemini_with_retry(prompt)
            result_data = extract_json_from_response(result_text)
            
            # STRICT PACING: 4.5s after EVERY request (guarantees <15 RPM)
            time.sleep(4.5)
            
            if not result_data or result_data.get("name") is None:
                logging.info(f"🚫 Filtered out (not valid residential project).")
                db_client.mark_signal_processed(signal_id)
                continue
            
            project_name = result_data.get("name")
            logging.info(f"✅ Processed [{domain}] -> {project_name}")
            
            # Build project record
            project_record = {
                "name": project_name,
                "address": result_data.get("address"),
                "city": result_data.get("city"),
                "developer": result_data.get("developer"),
                "architect": result_data.get("architect"),
                "gdv": result_data.get("gdv"),
                "units": result_data.get("units"),
                "stories": result_data.get("floors"),
                "status_stage": result_data.get("status_stage"),
                "key_people": result_data.get("individuals"),
                "source_signal_id": signal_id,
                "source_url": source_url,
                "created_at": int(time.time() * 1000)
            }
            
            # Save to DB and Link
            _, project_id = db_client.upsert_project(project_record)
            db_client.link_project_signal(project_id, signal_id)
            logging.info(f"💾 Saved & Linked: {project_name}")
            
            # Mark processed with date
            date_update = {}
            if result_data.get("article_date"):
                date_update["article_date"] = result_data.get("article_date")
            
            db_client.mark_signal_processed(signal_id, **date_update)
            
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower() or "RESOURCE_EXHAUSTED" in error_str:
                logging.warning(f"⚠️  Cooling down... (Rate limit hit)")
                time.sleep(60)  # Cool down 60s on rate limit
            else:
                logging.error(f"❌ Gemini Error: {e}")
                db_client.mark_signal_processed(signal_id)
                time.sleep(4.5)


def main():
    print("=" * 60)
    print("   THE MASS ENRICHER (ROBUST MODE)")
    print("   Processing ~2,000 signal backlog")
    print("   STRICT 15 RPM (4.5s pause after each request)")
    print("=" * 60)
    
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("❌ GOOGLE_API_KEY not found in .env")
        return
    
    print(f"✅ Gemini configured with model fallback")
    print(f"✅ Residential filter: ACTIVE")
    print(f"✅ Rate limit handling: 60s cooldown")
    print()
    
    while True:
        try:
            do_the_work()
        except KeyboardInterrupt:
            print("\n🛑 Stopping Mass Enricher...")
            break
        except Exception as e:
            logging.error(f"🔥 CRITICAL ERROR: {e}")
            time.sleep(10)

if __name__ == "__main__":
    main()
