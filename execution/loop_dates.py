import subprocess
import time
import sys
import datetime

def log(msg):
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] {msg}")

def run_script(script_name):
    log(f"🚀 Running {script_name}...")
    try:
        # Run and capture output
        result = subprocess.run(
            ["python3", script_name], 
            check=True, 
            capture_output=True, 
            text=True
        )
        print(result.stdout)
        if result.stderr:
            print(f"⚠️ STDERR: {result.stderr}")
        log(f"✅ {script_name} completed.")
        return True
    except subprocess.CalledProcessError as e:
        log(f"❌ {script_name} failed with code {e.returncode}.")
        print(e.stdout)
        print(e.stderr)
        return False

def main():
    log("🔄 STARTING DATE FIXATION LOOP")
    
    iteration = 1
    while True:
        log(f"--- Iteration {iteration} ---")
        
        # 1. Check Status
        # We assume check_date_quality.py exists and prints status
        log("📊 Checking Data Quality...")
        try:
            status = subprocess.run(["python3", "execution/check_date_quality.py"], capture_output=True, text=True)
            print(status.stdout)
            
            # Simple heuristic parsing: looking for "Missing Dates: 0"
            if "Missing Dates: 0" in status.stdout:
                log("🎉 SUCCESS: All dates backfilled!")
                break
        except Exception as e:
            log(f"⚠️ Status check failed: {e}")

        # 2. Run Fast Fix (Regex)
        run_script("execution/regex_date_fix.py")
        
        # 3. Run Slow Fix (Gemini Backfill)
        # This scans for processed signals without dates
        run_script("execution/backfill_dates.py")
        
        # 4. Wait a bit
        log("⏳ Sleeping 10s before next pass...")
        time.sleep(10)
        iteration += 1

if __name__ == "__main__":
    main()
