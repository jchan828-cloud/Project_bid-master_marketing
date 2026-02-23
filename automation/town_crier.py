import os
import requests
import json
import google.generativeai as genai
from sanity_client import get_config
from dotenv import load_dotenv

load_dotenv()

# The "Town Crier" LinkedIn Bot
# Automatically posts summaries of high-value opportunities to the Company Page.
# Implements "Safe Mode" (Company Page only).

def get_latest_posts():
    """Fetches recently published posts from Sanity."""
    config = get_config()
    # Query for posts published in the last 24 hours (simplified to last 5 for now)
    query = "*[_type == 'post'] | order(_createdAt desc)[0..4] {title, slug, excerpt, _id}"

    try:
        response = requests.get(
            f"https://{config['project_id']}.api.sanity.io/v2024-01-01/data/query/{config['dataset']}",
            headers={"Authorization": f"Bearer {config['token']}"},
            params={'query': query}
        )
        return response.json().get('result', [])
    except Exception as e:
        print(f"Error fetching posts: {e}")
        return []

def generate_linkedin_post(article):
    """Uses Gemini to write a LinkedIn post."""
    try:
        genai.configure(api_key=os.environ["GEMINI_API_KEY"])
        model = genai.GenerativeModel('gemini-1.5-flash')

        prompt = f"""
        You are a social media expert for a Government Contracting firm.
        Write a LinkedIn post to promote this new article:

        Title: {article['title']}
        Excerpt: {article['excerpt']}
        Link: https://bidmaster.com/blog/{article['slug']['current']}

        STRICT RULES:
        1. Professional but engaging tone.
        2. Focus on "Value for SMBs".
        3. Include 3-5 relevant hashtags (e.g., #GovCon #SmallBusiness #SetAside).
        4. Max length: 280 words.
        5. Call to Action: "Read the full analysis here:"
        """

        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating social copy: {e}")
        return None

def post_to_linkedin(content):
    """
    Posts content to the LinkedIn Company Page.
    Requires: LINKEDIN_ACCESS_TOKEN, LINKEDIN_ORG_ID
    """
    access_token = os.getenv("LINKEDIN_ACCESS_TOKEN")
    org_id = os.getenv("LINKEDIN_ORG_ID")

    if not access_token or not org_id:
        print("LinkedIn credentials missing. Skipping post.")
        return

    # Using LinkedIn v2 UGC API for company pages
    url = "https://api.linkedin.com/v2/ugcPosts"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0"
    }

    payload = {
        "author": f"urn:li:organization:{org_id}",
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": content
                },
                "shareMediaCategory": "NONE"
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code == 201:
            print("Successfully posted to LinkedIn!")
        else:
            print(f"Failed to post to LinkedIn: {response.status_code} {response.text}")
    except Exception as e:
        print(f"LinkedIn API Error: {e}")

def run_town_crier():
    print("Town Crier waking up...")
    posts = get_latest_posts()

    if not posts:
        print("No new posts found.")
        return

    # Process the most recent post
    latest = posts[0]

    print(f"Found latest post: {latest['title']}")
    social_copy = generate_linkedin_post(latest)

    if social_copy:
        print(f"Generated Copy:\n{social_copy}\n")
        # In production, uncomment:
        # post_to_linkedin(social_copy)
        print("(Safe Mode: Post simulated)")

if __name__ == "__main__":
    run_town_crier()
