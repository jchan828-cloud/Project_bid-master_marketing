import os
import time
import feedparser
import google.generativeai as genai
from sanity_client import create_draft_post
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
FEDERAL_REGISTER_RSS = "https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bagencies%5D%5B%5D=defense-department&conditions%5Btype%5D%5B%5D=RULE&conditions%5Btype%5D%5B%5D=PRORULE"
CANADA_GAZETTE_RSS = "https://canadagazette.gc.ca/rp-pr/p1/rss-eng.xml" # Placeholder URL

# Keywords to filter noise
KEYWORDS = ["defense", "medical", "compliance", "acquisition", "cybersecurity", "small business", "set-aside", "8(a)", "indigenous"]

def check_feeds():
    print("Scanning government feeds...")

    # 1. Fetch RSS Feeds
    feed_us = feedparser.parse(FEDERAL_REGISTER_RSS)
    print(f"Found {len(feed_us.entries)} entries in Federal Register.")

    new_topics = []

    for entry in feed_us.entries:
        title = entry.title
        summary = entry.summary
        link = entry.link

        # 2. Filter using simple keywords first (Performance optimization)
        if any(keyword in title.lower() or keyword in summary.lower() for keyword in KEYWORDS):
            print(f"Potential Topic Found: {title}")
            new_topics.append({
                "title": title,
                "summary": summary,
                "link": link,
                "source": "Federal Register"
            })

    # Process found topics
    for topic in new_topics:
        process_topic(topic)

def process_topic(topic):
    """
    Uses Gemini 3.0 to determine relevance and draft content.
    """
    print(f"Processing topic: {topic['title']}")

    # Check if we already have a post about this (Deduplication)
    # TODO: Implement Sanity query check here.

    # Trigger Blog Writer
    from blog_writer import generate_blog_post
    draft = generate_blog_post(topic)

    if draft:
        print("Draft generated successfully.")
        create_draft_post(draft)
    else:
        print("Topic deemed irrelevant by AI.")

if __name__ == "__main__":
    check_feeds()
