import feedparser

FEDERAL_REGISTER_RSS = "https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bagencies%5D%5B%5D=defense-department&conditions%5Btype%5D%5B%5D=RULE&conditions%5Btype%5D%5B%5D=PRORULE"

feed = feedparser.parse(FEDERAL_REGISTER_RSS)
print(f"Entries: {len(feed.entries)}")
for entry in feed.entries:
    print(f"Title: {entry.title}")
