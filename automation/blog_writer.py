import os
import google.generativeai as genai
import json

def generate_blog_post(topic):
    """
    Generates a draft blog post following Red Team Safety Protocols.
    """
    print(f"Drafting post for: {topic['title']}")

    try:
        genai.configure(api_key=os.environ["GEMINI_API_KEY"])
        model = genai.GenerativeModel('gemini-1.5-flash')

        prompt = f"""
        You are an expert Government Contracting Compliance Officer.
        Write a detailed, actionable blog post about the following regulatory update:

        Title: {topic['title']}
        Source Link: {topic['link']}
        Summary: {topic['summary']}

        STRICT RULES (Red Team Protocol):
        1. **No Hallucinations**: Only use facts from the provided summary or general knowledge of FAR/DFARS.
        2. **Cite Sources**: The first paragraph MUST include a link to the official source.
        3. **Editor's Note**: Include a section at the end called "Editor's Note" stating this content was AI-assisted and verified by a human.
        4. **Target Audience**: Small Business (SMB) GovCon founders. Focus on "What does this mean for my bid?"
        5. **Structure**: Headline, Executive Summary, The Change, The Impact, Action Items.
        6. **Format**: Return the result as a VALID JSON OBJECT with the following schema:
           {{
             "title": "String",
             "slug": "String (kebab-case)",
             "tier": "enterprise" | "smb" | "set-aside",
             "excerpt": "String (max 160 chars)",
             "body": "String (Markdown format)"
           }}
        """

        response = model.generate_content(prompt)
        content = response.text

        # Clean up Markdown code blocks if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].strip()

        data = json.loads(content)
        return data

    except Exception as e:
        print(f"Error generating content: {e}")
        return None

if __name__ == "__main__":
    test_topic = {
        "title": "Federal Acquisition Regulation: Small Business Set-Asides",
        "link": "https://www.federalregister.gov/documents/2023/10/05/2023-22119/federal-acquisition-regulation-small-business-set-asides",
        "summary": "DoD is amending the DFARS to implement a section of the NDAA for FY 2023 regarding small business set-asides."
    }
    # Mock run without API key just to verify syntax
    if "GEMINI_API_KEY" in os.environ:
        print(generate_blog_post(test_topic))
    else:
        print("Set GEMINI_API_KEY to test generation.")
