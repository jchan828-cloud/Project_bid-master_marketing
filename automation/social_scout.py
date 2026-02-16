import os
import praw
import google.generativeai as genai
import resend
from dotenv import load_dotenv

load_dotenv()

# The "Social Scout" Reddit Bot
# Monitors r/GovCon and r/smallbusiness for relevant keywords.
# Implements "Whisper Mode" (Emails draft reply to Admin).

KEYWORDS = ["set-aside", "8(a)", "SAM.gov", "GovCon", "proposal writing", "compliance"]

def get_reddit_client():
    return praw.Reddit(
        client_id=os.getenv("REDDIT_CLIENT_ID"),
        client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
        user_agent="BidMasterScout/1.0"
    )

def analyze_thread(submission):
    """Uses Gemini to draft a helpful reply."""
    try:
        genai.configure(api_key=os.environ["GEMINI_API_KEY"])
        model = genai.GenerativeModel('gemini-1.5-flash')

        prompt = f"""
        You are a helpful GovCon expert on Reddit.
        A user asked: "{submission.title} \n {submission.selftext[:500]}..."

        Draft a helpful, authoritative reply.

        STRICT RULES:
        1. Be empathetic and specific.
        2. Do NOT be salesy.
        3. Mention "Bid-Master" only if it directly solves their specific problem (e.g., "We have a free matrix for this").
        4. Keep it under 150 words.
        5. Format as Reddit Markdown.
        """

        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating reply: {e}")
        return None

def email_admin(submission, draft_reply):
    """Sends the draft reply to the admin via Resend."""
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        print("Resend API Key missing. Skipping email.")
        return

    resend.api_key = api_key

    html_content = f"""
    <h2>New Lead Found on Reddit: r/{submission.subreddit}</h2>
    <p><strong>Thread:</strong> <a href="{submission.url}">{submission.title}</a></p>
    <p><strong>User:</strong> u/{submission.author}</p>
    <hr>
    <h3>Draft Reply (Gemini 1.5):</h3>
    <pre style="background: #f4f4f4; padding: 10px;">{draft_reply}</pre>
    <hr>
    <p><em>Reply manually or approve automation (future feature).</em></p>
    """

    try:
        resend.Emails.send({
            "from": "scout@bidmaster.com", # Needs verified domain
            "to": "admin@bidmaster.com",   # Change to your email
            "subject": f"Social Scout Alert: {submission.title[:30]}...",
            "html": html_content
        })
        print(f"Email alert sent for thread: {submission.id}")
    except Exception as e:
        print(f"Failed to send email: {e}")

def run_scout():
    print("Social Scout patrolling...")
    reddit = get_reddit_client()

    # Monitor top subreddits
    subreddit = reddit.subreddit("GovCon+smallbusiness")

    # Check new posts (limit 10 for testing)
    for submission in subreddit.new(limit=10):
        # Filter by keywords
        text = (submission.title + submission.selftext).lower()
        if any(keyword.lower() in text for keyword in KEYWORDS):
            print(f"Relevant Thread Found: {submission.title}")

            # Draft Reply
            draft = analyze_thread(submission)

            if draft:
                print(f"Draft generated. Sending Whisper Mode alert...")
                # email_admin(submission, draft)
                print("(Whisper Mode: Email simulated)\n")

if __name__ == "__main__":
    try:
        if os.getenv("REDDIT_CLIENT_ID"):
            run_scout()
        else:
            print("Reddit credentials missing. Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET.")
    except Exception as e:
        print(f"Scout Error: {e}")
