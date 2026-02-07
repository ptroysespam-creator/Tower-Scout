"""
Pipeline Diagnostic - Tests credentials, database, AI, and writes.
"""
import os
import time
import json
import sys

# Add execution folder to path
sys.path.insert(0, '/Users/pablo/Downloads/Preconstruction Radar/execution')

from dotenv import load_dotenv
load_dotenv()

import db_client

# 1. SETUP & AUTH CHECK
print("\n--- 1. CHECKING CREDENTIALS ---")
api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    print("❌ CRITICAL: GOOGLE_API_KEY is missing from environment.")
    exit()
print(f"✅ API Key found: {api_key[:5]}...{api_key[-4:]}")

# Configure Gemini using the new SDK
from google import genai
client = genai.Client(api_key=api_key)

# 2. FETCH ONE RAW SIGNAL
print("\n--- 2. FETCHING RAW SIGNAL ---")
try:
    # Use our db_client
    signals = db_client.get_unprocessed_signals(limit=1)
except Exception as e:
    print(f"❌ DATABASE ERROR: Could not query raw_signals. {e}")
    exit()

if not signals:
    print("⚠️  No unprocessed signals found! Trying to fetch ANY signal...")
    # Fallback: Fetch ANY signal to test AI
    query = {"raw_signals": {}}
    response = db_client.query_db(query)
    signals = response.get("raw_signals", [])[:1] if response else []

if not signals:
    print("❌ CRITICAL: Database is empty. No signals to test.")
    exit()

target_signal = signals[0]
print(f"✅ Target Found: {target_signal.get('source_url', target_signal.get('url', 'No URL'))}")
content = target_signal.get('content', '')

if not content or len(content) < 50:
    print(f"❌ DATA QUALITY ERROR: Content is empty or too short ({len(content)} chars).")
    print("   -> The Scraper (Harvester) is saving empty entries.")
    exit()
else:
    print(f"✅ Content Valid ({len(content)} chars).")

# 3. TEST AI ENRICHMENT
print("\n--- 3. TESTING GEMINI 1.5 FLASH ---")

# Try multiple model names
model_options = [
    'gemini-1.5-flash',
    'models/gemini-1.5-flash', 
    'gemini-flash-latest',
    'gemini-2.0-flash'
]

prompt = f"""
Extract JSON for a real estate project from this text. 
Return ONLY JSON. No markdown.
Keys: name, gdv, developer, address, status_stage.

TEXT:
{content[:1000]}...
"""

for model_name in model_options:
    try:
        print(f"⏳ Trying model: {model_name}...")
        response = client.models.generate_content(
            model=model_name,
            contents=prompt
        )
        print(f"✅ AI Responded with {model_name}!")
        print(f"   Response Text: {response.text[:500]}...")
        break
    except Exception as e:
        error_str = str(e)
        if "404" in error_str:
            print(f"   ❌ {model_name}: Not found")
        elif "429" in error_str:
            print(f"   ⚠️  {model_name}: Rate limited (429)")
            break
        else:
            print(f"   ❌ {model_name}: {e}")

# 4. TEST DATABASE WRITE
print("\n--- 4. TESTING WRITE PERMISSIONS ---")
try:
    # Try to save a dummy project to ensure DB isn't blocking writes
    test_project = {
        "name": "DEBUG_TEST_PROJECT",
        "status_stage": "Debugging",
        "created_at": int(time.time() * 1000)
    }
    result = db_client.upsert_project(test_project)
    if result:
        print("✅ Write Successful: Created 'DEBUG_TEST_PROJECT'")
    else:
        print("❌ WRITE ERROR: upsert_project returned None")
except Exception as e:
    print(f"❌ WRITE ERROR: Could not save to 'projects'. {e}")

print("\n--- DIAGNOSTIC COMPLETE ---")
