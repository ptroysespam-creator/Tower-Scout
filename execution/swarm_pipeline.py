"""
Tower Scout Swarm - Groq + Gemini Multi-Engine Pipeline
Prioritizes Groq for speed/volume, Gemini as backup.
"""
import os
import time
import json
import random
import re
import logging
from dotenv import load_dotenv
from groq import Groq
import db_client

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    handlers=[
        logging.FileHandler('/Users/pablo/Downloads/Preconstruction Radar/swarm.log'),
        logging.StreamHandler()
    ]
)

load_dotenv()

# --- 1. SETUP CREDENTIALS ---
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

if not GROQ_API_KEY:
    print("❌ CRITICAL: GROQ_API_KEY missing. Swarm cannot start.")
    exit()

# Initialize Clients
groq_client = Groq(api_key=GROQ_API_KEY)

# Gemini client (new SDK)
gemini_client = None
if GOOGLE_API_KEY:
    from google import genai
    gemini_client = genai.Client(api_key=GOOGLE_API_KEY)

# --- 2. THE BRAINS ---
# We prioritize Groq for speed/volume, then Gemini for backup.
ENGINES = [
    {"name": "groq-llama3-70b", "type": "groq", "model": "llama-3.3-70b-versatile"},
    {"name": "groq-llama3-8b", "type": "groq", "model": "llama-3.1-8b-instant"},
    {"name": "gemini-flash-latest", "type": "gemini", "model": "gemini-flash-latest"},
    {"name": "gemini-2.0-flash", "type": "gemini", "model": "gemini-2.0-flash"},
]


def ask_groq(model, prompt):
    try:
        completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=model,
            temperature=0,
            response_format={"type": "json_object"}  # Groq supports JSON mode natively
        )
        return completion.choices[0].message.content
    except Exception as e:
        error_str = str(e)
        if "429" in error_str or "rate" in error_str.lower():
            logging.warning(f"   ⚠️ Groq Rate Limit ({model})")
        else:
            logging.warning(f"   ⚠️ Groq Error ({model}): {e}")
        return None


def ask_gemini(model_name, prompt):
    if not gemini_client:
        return None
    try:
        response = gemini_client.models.generate_content(
            model=model_name,
            contents=prompt
        )
        return response.text
    except Exception as e:
        error_str = str(e)
        if "404" in error_str:
            logging.info(f"   ❌ Gemini {model_name} not found (404)")
        elif "429" in error_str:
            logging.warning(f"   ⚠️ Gemini Rate Limit ({model_name})")
        else:
            logging.warning(f"   ⚠️ Gemini Error ({model_name}): {e}")
        return None


def swarm_generate(prompt):
    """Tries engines in order until one succeeds."""
    for engine in ENGINES:
        # Rate limit jitter to prevent synchronized 429s
        time.sleep(random.uniform(0.5, 1.5))
        
        result = None
        if engine["type"] == "groq":
            result = ask_groq(engine["model"], prompt)
        elif engine["type"] == "gemini":
            result = ask_gemini(engine["model"], prompt)
            
        if result:
            return result, engine["name"]
            
    return None, "FAILED"


def extract_json(text):
    """Extract JSON from response, handling markdown."""
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



# --- 2b. SOURCES CACHE ---
SOURCES_MAP = {}
def refresh_sources():
    try:
        logging.info("   🔄 Refreshing Sources Cache...")
        resp = db_client.query_db({"sources": {}})
        sources = resp.get("sources", [])
        for s in sources:
            SOURCES_MAP[s["id"]] = s.get("url")
        logging.info(f"   ✅ Cached {len(SOURCES_MAP)} sources.")
    except Exception as e:
        logging.error(f"   ⚠️ Failed to cache sources: {e}")

# --- 3. THE LOOP ---
def run_swarm():
    print("=" * 60)
    print("🚀 TOWER SCOUT SWARM ACTIVATED")
    print("   Engines: Groq (llama3-70b, mixtral) + Gemini")
    print("   Target: ~2,000 Backlog Signals")
    print("=" * 60)
    
    refresh_sources() # Initial Load

    while True:
        # A. Fetch Batch
        try:
            queue = db_client.get_unprocessed_signals(limit=10)
        except Exception as e:
            logging.error(f"DB Error: {e}")
            time.sleep(5)
            continue

        if not queue:
            logging.info("✅ Pipeline Clear. Sleeping 30s...")
            time.sleep(30)
            continue

        logging.info(f"\n⚡ Swarm processing batch of {len(queue)}...")

        for signal in queue:
            signal_id = signal.get("id")
            source_id = signal.get("source_id")
            
            # Resolve URL from Cache
            url = SOURCES_MAP.get(source_id)
            if not url:
                url = signal.get("source_url", signal.get("url", "Unknown"))
                
            content = signal.get("content", "")
            
            if len(content) < 100:
                logging.info(f"   🗑️ Empty content: {url[:50]}")
                db_client.mark_signal_processed(signal_id)
                continue

            # B. The Prompt
            prompt = f"""
Extract REAL ESTATE PROJECT data from this text as JSON.
RULES:
- Ignore retail-only (e.g. Target, Starbucks) or single-family homes.
- If irrelevant, return {{ "relevant": false }}.

**STAKEHOLDER EXTRACTION (CRITICAL):**
Extract every person mentioned. Format strings exactly as: "Name (Role)".
Examples: "Jorge Perez (Developer)", "Bernardo Fort-Brescia (Architect)", "John Doe (Sales Director)".
Return list: `individuals: ["Name (Role)", ...]`

**DATE EXTRACTION:**
Find the article publication date. Return `article_date` in "YYYY-MM-DD" format.
If not explicitly stated, estimate based on context (e.g. "Last Tuesday").

- Extract:
  {{
    "relevant": true,
    "name": "Project Name",
    "address": "Full Address",
    "city": "City Name",
    "developer": "Developer Name",
    "architect": "Architect Name",
    "article_date": "YYYY-MM-DD",
    "individuals": ["Name (Role)", ...],
    "gdv": "Value string (e.g. $500M)",
    "units": 0,
    "floors": 0,
    "description": "2-3 sentences.",
    "status_stage": "Construction/Planning/Completed/Proposed"
  }}

TEXT: {content[:2500]}
"""

            # C. Swarm Execution
            json_str, engine_used = swarm_generate(prompt)

            # D. Save
            if json_str:
                try:
                    data = extract_json(json_str)
                    
                    if data and data.get("relevant") is True:
                        project_name = data.get("name", "Unknown")
                        
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
                            "sourceLinks": [url],
                            "source_signal_id": signal_id,
                            "created_at": int(time.time() * 1000)
                        }
                        
                        db_client.upsert_project(project_record)
                        
                        # Mark processed AND save the date to the signal 
                        db_client.mark_signal_processed(signal_id, article_date=data.get("article_date"))
                        
                        logging.info(f"   ✅ [{engine_used}] Saved: {project_name}")
                    else:
                        logging.info(f"   🚫 [{engine_used}] Irrelevant: {url[:50]}")
                        db_client.mark_signal_processed(signal_id)

                except Exception as e:
                    logging.error(f"   ⚠️ Parse Error ({engine_used}): {e}")
                    db_client.mark_signal_processed(signal_id)
            else:
                logging.error("   ❌ Swarm Failed (All engines busy/errored). Cooldown 30s...")
                time.sleep(30)  # Cooldown before retrying
                continue  # Skip to next signal without marking processed

            # Pacing: 5s between successful requests
            time.sleep(5)


if __name__ == "__main__":
    run_swarm()
