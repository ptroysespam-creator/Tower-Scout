"""
The Geocoder - Nominatim (POLITE MODE)
Watches for projects without map coordinates and fixes them.
Increased timeout (10s) and pacing (2.5s) to avoid bans.
"""
import time
import logging
import ssl
import certifi
import os

# Setup logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(message)s',
    handlers=[
        logging.FileHandler('/Users/pablo/Downloads/Preconstruction Radar/geocoder.log'),
        logging.StreamHandler()
    ]
)

# Set SSL Certificate file to certifi's bundle
os.environ['SSL_CERT_FILE'] = certifi.where()

# Initialize SSL context for Mac compatibility
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable
import db_client

# Initialize Geocoder with POLITE settings
geolocator = Nominatim(
    user_agent="tower_scout_operations_v1",
    timeout=10  # Increased timeout to prevent failures
)


def geocode_with_fallback(project):
    """Try multiple geocoding strategies."""
    name = project.get('name', 'Unknown')
    address = project.get('address')
    city = project.get('city')
    
    location = None
    
    # Strategy 1: Full address + city
    if address and city:
        query = f"{address}, {city}"
        try:
            logging.info(f"  📍 Trying: {query}")
            location = geolocator.geocode(query)
            if location:
                return location
        except (GeocoderTimedOut, GeocoderUnavailable) as e:
            logging.warning(f"  ⏱️  Timeout: {e}")
        except Exception as e:
            logging.warning(f"  ❌ Error: {e}")
        
        # Polite pause between attempts
        time.sleep(2.5)
    
    # Strategy 2: Just address
    if not location and address:
        try:
            logging.info(f"  📍 Trying address only: {address}")
            location = geolocator.geocode(address)
            if location:
                return location
        except Exception as e:
            logging.warning(f"  ❌ Error: {e}")
        
        time.sleep(2.5)
    
    # Strategy 3: Project name + city (FALLBACK)
    if not location and city:
        query = f"{name}, {city}"
        try:
            logging.info(f"  📍 Fallback: {query}")
            location = geolocator.geocode(query)
            if location:
                return location
        except Exception as e:
            logging.warning(f"  ❌ Error: {e}")
        
        time.sleep(2.5)
    
    # Strategy 4: Just project name
    if not location:
        try:
            logging.info(f"  📍 Last resort: {name}")
            location = geolocator.geocode(name)
            if location:
                return location
        except Exception as e:
            logging.warning(f"  ❌ Error: {e}")
    
    return None


def do_the_work():
    """Batch geocode projects without coordinates."""
    
    # Fetch batch of 20 projects missing coordinates
    projects = db_client.get_projects_without_coordinates(limit=20)
    
    if not projects:
        logging.info("🗺️  All projects geocoded. Sleeping 60s...")
        time.sleep(60)
        return

    logging.info(f"📥 Fetched batch of {len(projects)} projects to geocode...")

    for i, project in enumerate(projects):
        project_id = project['id']
        name = project.get('name', 'Unknown')
        
        logging.info(f"[{i+1}/{len(projects)}] 🔍 Geocoding '{name}'...")
        
        location = geocode_with_fallback(project)
                
        if location:
            lat = location.latitude
            lng = location.longitude
            logging.info(f"  ✅ Geocoded [{name}] -> [{lat:.4f}, {lng:.4f}]")
            
            # Update DB with coordinates
            db_client.update_project_coordinates(project_id, lat, lng)
        else:
            logging.warning(f"  ⚠️  Failed to locate '{name}'")

        # POLITE pacing: 2.5s between projects
        time.sleep(2.5)


def main():
    print("=" * 60)
    print("   THE GEOCODER (POLITE MODE)")
    print("   Watching for projects without map dots")
    print("   Timeout: 10s | Pacing: 2.5s")
    print("=" * 60)
    
    print(f"✅ Geocoder initialized with polite settings")
    print(f"✅ User agent: tower_scout_operations_v1")
    print()
    
    while True:
        try:
            do_the_work()
        except KeyboardInterrupt:
            print("\n🛑 Stopping Geocoder...")
            break
        except Exception as e:
            logging.error(f"🔥 CRITICAL ERROR: {e}")
            time.sleep(10)

if __name__ == "__main__":
    main()
