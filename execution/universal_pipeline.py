"""
Universal Pipeline - Self-Healing Mode
Uses model roster fallback and proper InstantDB transactions.
"""
import os
import time
import json
import re
import logging
from dotenv import load_dotenv
import db_client

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    handlers=[
        logging.FileHandler('/Users/pablo/Downloads/Preconstruction Radar/universal_pipeline.log'),
        logging.StreamHandler()
    ]
)

load_dotenv()

# --- CONFIGURATION ---
API_KEY = os.environ.get("GOOGLE_API_KEY")
if not API_KEY:
    print("❌ CRITICAL: GOOGLE_API_KEY missing.")
    exit()

# Use the new google-genai SDK
from google import genai
client = genai.Client(api_key=API_KEY)

# List of models to try in order. If one fails, it tries the next.
MODEL_ROSTER = [
    "gemini-1.5-flash",
    "models/gemini-1.5-flash",
    "gemini-flash-latest",
    "gemini-1.5-pro",
    "models/gemini-1.5-pro",
    "gemini-2.0-flash",
    "gemini-1.0-pro",
    "gemini-pro"
]


def generate_with_fallback(prompt):
    """Try multiple models with fallback logic."""
    for model_name in MODEL_ROSTER:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )
            if response.text:
                logging.info(f"✅ Model {model_name} succeeded")
                return response.text
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower():
                logging.warning(f"⚠️  Rate Limit (429) on {model_name}. Sleeping 60s...")
                time.sleep(60)
                # Retry same model after sleep
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    if response.text:
                        return response.text
                except:
                    continue  # Move to next model if retry fails
            elif "404" in error_str:
                logging.info(f"❌ Model {model_name} not found (404). Skipping...")
                continue
            else:
                logging.warning(f"⚠️  Error on {model_name}: {e}")
                continue
    return None


def extract_json_from_response(text):
    """Extract JSON from AI response, handling markdown and edge cases."""
    text = text.strip()
    
    # Remove markdown code blocks
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
        # Try to find JSON object in text
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except:
                pass
        return None


def run_pipeline():
    print("=" * 60)
    print("🚀 UNIVERSAL PIPELINE (Self-Healing Mode)")
    print("   Model Roster Fallback Active")
    print("   5s pacing between requests")
    print("=" * 60)
    
    while True:
        # 1. FETCH BATCH
        try:
            queue = db_client.get_unprocessed_signals(limit=5)
        except Exception as e:
            logging.error(f"❌ DB Read Error: {e}. Sleeping 10s...")
            time.sleep(10)
            continue

        if not queue:
            logging.info("💤 Pipeline Clear (No pending signals). Sleeping 60s...")
            time.sleep(60)
            continue

        logging.info(f"📥 Processing Batch of {len(queue)} signals...")

        for signal in queue:
            signal_id = signal.get("id")
            content = signal.get("content", "")
            url = signal.get("source_url", signal.get("url", "No URL"))
            
            if len(content) < 100:
                logging.info(f"🗑️  Skipping empty signal: {url}")
                db_client.mark_signal_processed(signal_id)
                continue

            # 2. ENRICH (The Brain)
            prompt = f"""
You are a Real Estate Data Analyst. Analyze this text from {url}.

STRICT RULES:
1. IGNORE Single Family Homes, Retail-only stores (e.g. Amazon Fresh, Target), and minor renovations.
2. FOCUS on: Multi-family, Condos, High-rises, Mixed-use, or Major Hospitality.
3. If irrelevant, return JSON: {{ "relevant": false }}

If valid, extract this JSON:
{{
    "relevant": true,
    "name": "Project Name (or Address if unnamed)",
    "address": "Full Address",
    "city": "City",
    "developer": "Developer Name",
    "architect": "Architect Name",
    "gdv": "Value in $ (e.g. $50M)",
    "units": 0,
    "floors": 0,
    "status_stage": "Planning/Permitting/Construction",
    "individuals": ["Name 1 (Role)", "Name 2 (Role)"],
    "description": "2 sentence summary."
}}

Return ONLY valid JSON, no extra text.

TEXT:
{content[:2000]}
"""

            json_text = generate_with_fallback(prompt)

            # 3. SAVE
            if json_text:
                try:
                    data = extract_json_from_response(json_text)
                    
                    if data and data.get("relevant") is True:
                        project_name = data.get("name", "Unknown")
                        
                        # Build project record
                        project_record = {
                            "name": project_name,
                            "address": data.get("address"),
                            "city": data.get("city"),
                            "developer": data.get("developer"),
                            "architect": data.get("architect"),
                            "gdv": data.get("gdv"),
                            "units": data.get("units"),
                            "stories": data.get("floors"),
                            "status_stage": data.get("status_stage"),
                            "key_people": data.get("individuals"),
                            "description": data.get("description"),
                            "source_url": url,
                            "source_signal_id": signal_id,
                            "created_at": int(time.time() * 1000)
                        }
                        
                        # Save to projects
                        db_client.upsert_project(project_record)
                        
                        # Mark signal processed
                        db_client.mark_signal_processed(signal_id)
                        
                        logging.info(f"✅ SAVED: {project_name} ({data.get('city')})")
                    else:
                        logging.info(f"🚫 Irrelevant: {url[:50]}...")
                        db_client.mark_signal_processed(signal_id)

                except Exception as e:
                    logging.error(f"⚠️  Parse/Save Error: {e}")
                    db_client.mark_signal_processed(signal_id)
            else:
                logging.error("❌ AI Failed to generate (all models exhausted)")
                db_client.mark_signal_processed(signal_id)

            # 4. PACING (Crucial for Free Tier)
            logging.info("⏳ Cooling down (5s)...")
            time.sleep(5)


if __name__ == "__main__":
    run_pipeline()
