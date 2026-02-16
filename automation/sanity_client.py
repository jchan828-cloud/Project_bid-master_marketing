import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

def get_config():
    return {
        "project_id": os.getenv("SANITY_PROJECT_ID"),
        "dataset": os.getenv("SANITY_DATASET"),
        "token": os.getenv("SANITY_API_TOKEN"),
        "api_version": "v2024-01-01"
    }

def create_draft_post(post_data):
    config = get_config()

    if not config["project_id"] or not config["token"]:
        print("Sanity configuration missing (SANITY_PROJECT_ID or SANITY_API_TOKEN). Check .env file.")
        return

    url = f"https://{config['project_id']}.api.sanity.io/v2024-01-01/data/mutate/{config['dataset']}"

    headers = {
        "Authorization": f"Bearer {config['token']}",
        "Content-Type": "application/json"
    }

    slug = post_data.get('slug')
    if not slug:
        print("Slug missing from post data.")
        return

    # 1. Check for duplicates (Idempotency) using GROQ
    query = f"*[_type == 'post' && slug.current == '{slug}']"

    try:
        response = requests.get(
            f"https://{config['project_id']}.api.sanity.io/v2024-01-01/data/query/{config['dataset']}",
            headers=headers,
            params={'query': query}
        )

        if response.status_code == 200:
            result = response.json().get('result', [])
            if result and len(result) > 0:
                print(f"Skipping: Post '{post_data['title']}' (slug: {slug}) already exists.")
                return
        else:
            print(f"Failed to check duplicates: {response.status_code} {response.text}")
            return

    except Exception as e:
        print(f"Exception checking duplicates: {e}")
        return

    # 2. Convert Content to Simple Portable Text Block
    # Simplification: entire body into one block
    content_blocks = [
        {
            "_type": "block",
            "children": [
                {
                    "_type": "span",
                    "text": post_data.get("body", "No content generated.")
                }
            ],
            "markDefs": [],
            "style": "normal"
        }
    ]

    # 3. Create Draft Mutation
    mutations = {
        "mutations": [
            {
                "create": {
                    "_type": "post",
                    "title": post_data["title"],
                    "slug": {
                        "_type": "slug",
                        "current": slug
                    },
                    "tier": post_data.get("tier", "smb"),
                    "excerpt": post_data.get("excerpt", ""),
                    "content": content_blocks,
                    "featured": False
                    # No publishedAt -> Draft
                }
            }
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=mutations)
        if response.status_code == 200:
            print(f"Draft created successfully: {post_data['title']}")
        else:
            print(f"Failed to create draft: {response.status_code} {response.text}")

    except Exception as e:
        print(f"Failed to create draft mutation: {e}")
