#!/usr/bin/env python3
"""
Test script to debug skills extraction from resume
Run this to test if the AI skills extraction is working
"""

import requests
import json
from dotenv import load_dotenv
import os
# Load environment variables
load_dotenv()
API_KEY = os.getenv("OPENROUTER_API_KEY")

if not API_KEY:
    raise EnvironmentError(
        "❌ Missing OpenRouter API key.\n"
        "Please create a `.env` file and add:\n"
        "OPENROUTER_API_KEY=sk-or-v1-yourkeyhere"
    )

# Sample resume text for testing
SAMPLE_RESUME = """
John Doe
Senior Software Engineer
Email: john@example.com | Phone: +91-9876543210
Location: Bangalore, Karnataka

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years in full-stack development, 
specializing in Python, JavaScript, and cloud technologies.

SKILLS
- Programming Languages: Python, JavaScript, TypeScript, Java, SQL
- Frontend: React, Vue.js, HTML5, CSS3, Tailwind CSS
- Backend: Node.js, Django, Flask, FastAPI, Express.js
- Databases: PostgreSQL, MongoDB, MySQL, Redis
- Cloud & DevOps: AWS (EC2, S3, Lambda), Docker, Kubernetes, Jenkins
- Tools: Git, VS Code, Jira, Postman

EXPERIENCE
Senior Software Engineer | Tech Corp | 2020 - Present
- Developed microservices using Python and Node.js
- Implemented CI/CD pipelines with Jenkins and Docker
- Managed AWS infrastructure and deployments

Software Engineer | StartupXYZ | 2018 - 2020
- Built responsive web applications with React and TypeScript
- Designed RESTful APIs using Django and PostgreSQL

EDUCATION
Bachelor of Technology in Computer Science
XYZ University | 2014 - 2018
"""

def test_ai_extraction(api_key: str):
    """Test AI-based skills extraction"""
    prompt = f"""
You are an expert resume parser. Analyze the resume and return valid JSON with these fields:
- Job_Title: The current or most recent job title
- Education_Level: Highest education (e.g., "Bachelors", "Masters", "PhD", "High School")
- Location: City/State/Country
- Skills: An array of ALL technical and professional skills found (be comprehensive)

Return ONLY valid JSON, no explanations.

Resume:
{SAMPLE_RESUME}
"""
    
    print("=" * 60)
    print("TESTING SKILLS EXTRACTION")
    print("=" * 60)
    
    try:
        print("\n1. Sending request to OpenRouter API...")
        resp = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=20
        )
        
        print(f"   Status Code: {resp.status_code}")
        
        resp_json = resp.json()
        
        if "error" in resp_json:
            print(f"\n❌ ERROR: {resp_json['error']}")
            return
        
        content = resp_json["choices"][0]["message"]["content"]
        print(f"\n2. Raw AI Response:\n{content}\n")
        
        # Clean and parse
        import re
        content = re.sub(r"^```(json)?|```$", "", content.strip())
        parsed = json.loads(content)
        
        print("3. Parsed Results:")
        print(f"   Job Title: {parsed.get('Job_Title', 'N/A')}")
        print(f"   Education: {parsed.get('Education_Level', 'N/A')}")
        print(f"   Location: {parsed.get('Location', 'N/A')}")
        print(f"\n   Skills ({len(parsed.get('Skills', []))}):")
        
        skills = parsed.get('Skills', [])
        if isinstance(skills, list):
            for i, skill in enumerate(skills, 1):
                print(f"      {i}. {skill}")
        else:
            print(f"      {skills}")
        
        print("\n✅ SUCCESS! Skills extraction working correctly.")
        
    except Exception as e:
        print(f"\n❌ ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Use the hardcoded API key from backend
   
    print("Testing with sample resume...")
    test_ai_extraction(API_KEY)
    
    print("\n" + "=" * 60)
    print("RECOMMENDATIONS:")
    print("=" * 60)
    print("""
1. If you see skills listed above ✅
   → Skills extraction is working! Check backend logs when uploading resume.

2. If you see an API error ❌
   → Check if the OpenRouter API key is valid
   → Verify internet connection
   → Check if OpenRouter service is up

3. If skills list is empty but no error
   → The AI might not be extracting skills properly
   → Try improving the prompt
   → Check if resume text is being passed correctly

4. To debug your actual resume:
   → Check backend logs (console) when uploading
   → Look for "Extracted X characters from resume"
   → Look for "Sending resume text to AI"
   → Look for "Parsed AI response: Skills count=X"
    """)
