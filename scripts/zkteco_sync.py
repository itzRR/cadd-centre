import time
import requests
import json
import os
from zk import ZK, const

# ==========================================
# CONFIGURATION
# ==========================================
# 1. ZKTeco Device IP and Port (Check on your machine: Menu -> Comm -> Ethernet)
ZK_IP = '192.168.1.201'
ZK_PORT = 4370

# 2. Your Scholar-Sync Website URL (Change to your live Vercel URL when deployed)
API_URL = 'http://localhost:3000/api/ims/attendance/push' 
# API_URL = 'https://cadd-centre-olive.vercel.app/api/ims/attendance/push'

# 3. Secret Token (Must match EXPECTED_SECRET in the Next.js API)
API_SECRET = 'cadd_zkteco_secret_2026'

# 4. How often to poll the machine (in seconds). 60 = 1 minute.
POLL_INTERVAL = 60 

# File to store the last timestamp we successfully synced, to avoid sending duplicates.
LAST_SYNC_FILE = 'last_sync.txt'

def get_last_sync_time():
    if os.path.exists(LAST_SYNC_FILE):
        with open(LAST_SYNC_FILE, 'r') as f:
            return f.read().strip()
    return "2000-01-01 00:00:00"

def save_last_sync_time(timestamp):
    with open(LAST_SYNC_FILE, 'w') as f:
        f.write(str(timestamp))

def sync_attendance():
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Connecting to ZKTeco device at {ZK_IP}...")
    zk = ZK(ZK_IP, port=ZK_PORT, timeout=5)
    conn = None
    
    try:
        conn = zk.connect()
        print("Connected successfully!")
        
        last_sync = get_last_sync_time()
        print(f"Fetching logs since {last_sync}...")
        
        # get_attendance returns a list of Attendance objects
        attendances = conn.get_attendance()
        
        # Filter new records
        new_records = []
        latest_timestamp = last_sync
        
        for att in attendances:
            # att.timestamp is a datetime object
            att_time_str = str(att.timestamp)
            if att_time_str > last_sync:
                new_records.append({
                    "device_id": str(att.user_id),
                    "timestamp": att_time_str
                })
                if att_time_str > latest_timestamp:
                    latest_timestamp = att_time_str

        if not new_records:
            print("No new attendance records found.")
            return

        print(f"Found {len(new_records)} new records. Sending to server...")
        
        headers = {
            "Content-Type": "application/json",
            "x-zkteco-secret": API_SECRET
        }
        
        response = requests.post(
            API_URL, 
            json={"records": new_records}, 
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"Success! Processed: {result.get('processed')}, Skipped: {result.get('skipped')}")
            # Only update the save file if the server successfully received it
            save_last_sync_time(latest_timestamp)
        else:
            print(f"Error from server ({response.status_code}): {response.text}")

    except Exception as e:
        print(f"Error during sync: {e}")
    finally:
        if conn:
            conn.disconnect()

if __name__ == "__main__":
    print("=======================================")
    print(" CADD Centre ZKTeco Sync Service Auto  ")
    print("=======================================")
    print(f"Target API: {API_URL}")
    
    while True:
        sync_attendance()
        print(f"Waiting {POLL_INTERVAL} seconds until next sync...\n")
        time.sleep(POLL_INTERVAL)
