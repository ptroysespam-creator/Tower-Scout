import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    print("No GOOGLE_API_KEY")
    exit()

print(f"Key found: {api_key[:5]}...")

genai.configure(api_key=api_key)
print("--- Available Models ---")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error listing models: {e}")
