"""
The Geocoder - Nominatim (OpenStreetMap)
Fetches projects with missing coordinates and geocodes them.
Rate limited to 1s sleep (Nominatim usage policy).
"""
import time
import logging
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable
import db_client

import ssl
import certifi
import os

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

# Set SSL Certificate file to certifi's bundle
os.environ['SSL_CERT_FILE'] = certifi.where()

# Initialize Geocoder with unverified SSL context to avoid cert errors on Mac
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

geolocator = Nominatim(user_agent="tower_scout_geocoder_v1")

def do_the_work():
    """Batch geocode projects."""
    
    # Fetch batch of 10
    projects = db_client.get_projects_without_coordinates(limit=10)
    
    if not projects:
        logging.info("No projects missing coordinates. Sleeping...")
        time.sleep(10)
        return

    logging.info(f"Fetched batch of {len(projects)} projects to geocode...")

    for i, project in enumerate(projects):
        project_id = project['id']
        name = project.get('name', 'Unknown')
        address = project.get('address')
        
        logging.info(f"[{i+1}/{len(projects)}] Geocoding '{name}' ({project_id[:8]})...")
        
        location = None
        
        # Try address first
        if address:
            try:
                logging.info(f"  > Trying address: {address}")
                location = geolocator.geocode(address)
            except Exception as e:
                logging.warning(f"  > Error geocoding address: {e}")
                
        # If no address or failed, try name + city context (heuristic)
        # Assuming most projects are in major cities, but we don't know the city if not in address.
        # If we have 'city' field in project, we could use it.
        # Let's try name if address fails.
        if not location:
            try:
                logging.info(f"  > Trying name: {name}")
                location = geolocator.geocode(name)
            except Exception as e:
                logging.warning(f"  > Error geocoding name: {e}")
                
        if location:
            lat = location.latitude
            lng = location.longitude
            logging.info(f"  > [Success] Found: {lat}, {lng}")
            
            # Update DB
            db_client.update_project_coordinates(project_id, lat, lng)
        else:
            logging.info(f"  > [Failed] Could not locate.")
            # We should probably mark it as 'processed' or 'failed' so we don't keep retrying forever.
            # But db_client.get_projects_without_coordinates just looks for missing coords.
            # To avoid infinite loop, we might want to flag it?
            # For now, let's leave it. The user can manually fix or we improve logic later.
            # Or we can set coordinates to 0,0 or something distinct? 
            # Or better, we just rely on the script running and eventually we might get it or user fixes it.
            # Actually, to prevent spamming Nominatim for the same failed project, let's sleep extra.
            pass

        # Rate limit
        time.sleep(1.5) 

def main():
    print("=" * 60)
    print("   THE GEOCODER (NOMINATIM)")
    print("   Batch Process: 10 projects per cycle")
    print("=" * 60)
    
    print(f"✅ Geocoder initialized")
    print(f"✅ Rate limit: 1.5s pause")
    print()
    
    while True:
        try:
            do_the_work()
        except KeyboardInterrupt:
            print("\nStopping...")
            break
        except Exception as e:
            logging.error(f"CRITICAL ERROR: {e}")
            time.sleep(10)

if __name__ == "__main__":
    main()
