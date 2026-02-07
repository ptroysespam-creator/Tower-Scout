import os
import time
import json
import logging
from dotenv import load_dotenv
from groq import Groq
import db_client

load_dotenv()
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

# Credentials
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

gemini_client = None
if GOOGLE_API_KEY:
    try:
        from google import genai
        gemini_client = genai.Client(api_key=GOOGLE_API_KEY)
        logging.info("✨ Using Gemini 2.0 Flash (via google.genai)")
    except ImportError:
        logging.error("❌ google.genai module not found.")

if not gemini_client:
    logging.warning("⚠️ Gemini client failed to initialize. Will fallback or exit if no other options.")

def extract_date(text):
    if not text: return None
    if not gemini_client: return None

    # Flash has large context
    metrics_text = text[:30000]
    
    prompt = f"""
    You are a data extraction engine.
    Task: Extract the exact publication date of the article.
    Format: YYYY-MM-DD
    Context: If no explicit date ("Jan 1, 2024"), estimate from relative dates ("published 2 days ago") relative to today ({time.strftime('%Y-%m-%d')}). 
    If absolutely no date context, return null.
    
    Return pure JSON: {{ "date": "YYYY-MM-DD" }}
    
    TEXT:
    {metrics_text}
    """
    
    max_retries = 10
    for attempt in range(max_retries):
        try:
            # New SDK usage
            response = gemini_client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config={"response_mime_type": "application/json"}
            )
            
            if not response.text: return None
            data = json.loads(response.text)
            return data.get("date")
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                wait = 30 * (attempt + 1)
                logging.warning(f"   ⚠️ Rate Limit. Retry {attempt+1}/{max_retries} in {wait}s...")
                time.sleep(wait)
                continue
            else:
                logging.error(f"   ❌ Generation Error: {e}")
                return None
    return None

def run_backfill():
    print("⏳ STARTING DATE BACKFILL (GEMINI 2.0 POWERED)...")
    
    try:
        resp = db_client.query_db({"raw_signals": {}})
        signals = resp.get("raw_signals", [])
    except Exception as e:
        print(f"   ⚠️ DB Fetch Failed: {e}")
        return
    
    targets = [s for s in signals if s.get("processed") is True and not s.get("article_date")]
    total = len(targets)
    print(f"   Found {total} processed signals missing dates.")
    
    if total == 0:
        print("   ✅ All processed signals have dates!")
        return

    for i, s in enumerate(targets):
        print(f"[{i+1}/{total}] 🔍 {s.get('id')} ...")
        
        date = extract_date(s.get("content", ""))
        
        if date:
            print(f"   📅 Found: {date}")
            try:
                db_client.mark_signal_processed(s["id"], article_date=date)
            except Exception as e:
                print(f"   ⚠️ Save Failed: {e}")
        else:
            print("   ❌ No date found context.")

        # Rate Limit Pacing (Gemini Flash is fast, but let's be safe: 2s)
        time.sleep(2)

if __name__ == "__main__":
    run_backfill()
