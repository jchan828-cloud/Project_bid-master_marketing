import time
import schedule
import threading
from topic_radar import check_feeds
from town_crier import run_town_crier
from social_scout import run_scout
from dotenv import load_dotenv

# The "Automation Engine" Scheduler
# Orchestrates the three bots:
# 1. Topic Radar (RSS -> Blog)
# 2. Town Crier (Sanity -> LinkedIn)
# 3. Social Scout (Reddit -> Email)

load_dotenv()

def job_radar():
    try:
        check_feeds()
    except Exception as e:
        print(f"Radar Job Failed: {e}")

def job_town_crier():
    try:
        run_town_crier()
    except Exception as e:
        print(f"Town Crier Job Failed: {e}")

def job_social_scout():
    try:
        run_scout()
    except Exception as e:
        print(f"Social Scout Job Failed: {e}")

def run_scheduler():
    print("Starting Bid-Master Automation Engine...")

    # Schedule Configuration

    # 1. Topic Radar: Run every morning at 6 AM (check for new regulations)
    schedule.every().day.at("06:00").do(job_radar)

    # 2. Town Crier: Run twice daily (9 AM and 2 PM) to promote content
    schedule.every().day.at("09:00").do(job_town_crier)
    schedule.every().day.at("14:00").do(job_town_crier)

    # 3. Social Scout: Run every hour (monitor Reddit)
    schedule.every().hour.do(job_social_scout)

    # Run all once immediately on startup for verification
    print("Running initial startup checks...")
    job_radar()
    job_town_crier()
    job_social_scout()

    print("Scheduler active. Press Ctrl+C to exit.")

    while True:
        schedule.run_pending()
        time.sleep(60)

if __name__ == "__main__":
    run_scheduler()
