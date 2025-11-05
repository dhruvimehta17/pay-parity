

#now should work

# payparity-backend/app.py
from pydoc import render_doc
from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import tempfile
import joblib
import numpy as np
import pandas as pd
from PyPDF2 import PdfReader
from docx import Document
import re
import requests
import json
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import httpx
import easyocr
reader = easyocr.Reader(['en'])

from dotenv import load_dotenv

load_dotenv()
try:
    import easyocr
    reader = easyocr.Reader(['en'])

    OCR_AVAILABLE = True
    reader = easyocr.Reader(['en'])
except ImportError:
    OCR_AVAILABLE = False
    print("⚠️  EasyOCR not available. Install with: pip install easyocr")

from typing import List, Dict, Optional, Literal
from datetime import datetime
from dateutil import parser as dateparser
from pydantic import BaseModel

app = FastAPI(title="PayParity Backend API", version="1.0")

# allow your frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    os.getenv("FRONTEND_URL_1", "http://localhost:8080"),
    os.getenv("FRONTEND_URL_2", "http://127.0.0.1:8080")
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Load model and dataset
# ----------------------------

MODEL_PATH = os.path.join(os.path.dirname(__file__), os.getenv("MODEL_PATH", "output/xgb_salary_model_optimized.pkl"))
DATASET_PATH = os.path.join(os.path.dirname(__file__), os.getenv("DATASET_PATH", "output/19kdata.csv"))


if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model not found at {MODEL_PATH}")
if not os.path.exists(DATASET_PATH):
    raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")

print("🔹 Loading model from", MODEL_PATH)
model = joblib.load(MODEL_PATH)
print("✅ Model loaded")

print("🔹 Loading dataset from", DATASET_PATH)
salary_dataset = pd.read_csv(DATASET_PATH)
print(f"✅ Dataset loaded: {len(salary_dataset)} records")

# ----------------------------
# Helpers: extract text with OCR fallback
# ----------------------------
def extract_text_with_ocr(file_path: str) -> str:
    """Extract text from images using EasyOCR"""
    if not OCR_AVAILABLE:
        return ""
    try:
        print(f"Attempting EasyOCR on: {file_path}")
        result = reader.readtext(file_path, detail=0)
        text = " ".join(result)
        print(f"EasyOCR extracted {len(text)} characters")
        return text
    except Exception as e:
        print(f"OCR error: {e}")
        return ""

def extract_text_from_pdf_with_ocr(file_path: str) -> str:
    """Extract text from PDF, use EasyOCR if regular extraction fails"""
    text = ""
    try:
        # Try normal text extraction first
        with open(file_path, "rb") as f:
            reader = PdfReader(f)
            print(f"PDF has {len(reader.pages)} pages")
            for page in reader.pages:
                page_text = page.extract_text() or ""
                text += page_text + "\n"

        # If little text, fallback to EasyOCR
        if len(text.strip()) < 100 and OCR_AVAILABLE:
            print(f"Low text extraction ({len(text)} chars), attempting EasyOCR on PDF pages...")
            try:
                images = convert_from_path(file_path)
                ocr_text = ""
                for i, image in enumerate(images):
                    temp_img = os.path.join(tempfile.gettempdir(), f"page_{i}.jpg")
                    image.save(temp_img, "JPEG")
                    result = render_doc.readtext(temp_img, detail=0, paragraph=True)
                    ocr_text += " ".join(result) + "\n"
                if len(ocr_text.strip()) > len(text.strip()):
                    print(f"EasyOCR extracted more text: {len(ocr_text)} chars vs {len(text)} chars")
                    text = ocr_text
            except Exception as ocr_error:
                print(f"EasyOCR PDF fallback failed: {ocr_error}")
        return text

    except Exception as e:
        print(f"PDF extraction error: {e}")
        import traceback
        traceback.print_exc()
        return ""


def extract_text_from_resume(file_path: str) -> str:
    ext = file_path.split('.')[-1].lower()
    text = ""
    print(f"Extracting text from file: {file_path} (type: {ext})")
    
    try:
        if ext == "pdf":
            text = extract_text_from_pdf_with_ocr(file_path)
        elif ext in ("docx", "doc"):
            doc = Document(file_path)
            text = "\n".join([p.text for p in doc.paragraphs])
        elif ext == "txt":
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
        elif ext in ("png", "jpg", "jpeg", "tiff", "bmp", "gif"):
            # Image files - use OCR directly
            text = extract_text_with_ocr(file_path)
        else:
            print(f"Unsupported file type: {ext}")
        
        print(f"Final extracted text: {len(text)} characters")
    except Exception as e:
        print(f"Error extracting text from {file_path}: {e}")
        import traceback
        traceback.print_exc()
    
    return text or ""

# ----------------------------
# Salary Parser - handles various formats
# ----------------------------
def parse_salary_input(salary_input: str) -> float:
    """Parse salary from various formats like '5 lakh', '5lpa', '5,00,000', etc."""
    if not salary_input:
        return 0.0
    
    # Convert to string and clean
    salary_str = str(salary_input).strip().lower()
    
    # Remove rupee symbol
    salary_str = salary_str.replace('₹', '').replace('rs', '').replace('inr', '').strip()
    
    # Handle formats like "5 lakh", "5lakh", "5 lakhs", "5l"
    lakh_patterns = [
        r'([\d.]+)\s*l(?:akh|akhs)?(?:\s*p\.?a\.?)?\b',
        r'([\d.]+)\s*lpa\b',
        r'([\d.]+)\s*l\b'
    ]
    
    for pattern in lakh_patterns:
        match = re.search(pattern, salary_str)
        if match:
            value = float(match.group(1))
            return value * 100000  # Convert to actual amount
    
    # Handle formats like "5 cr", "5crore", "5 crores"
    crore_patterns = [
        r'([\d.]+)\s*cr(?:ore|ores)?\b',
        r'([\d.]+)\s*c\b'
    ]
    
    for pattern in crore_patterns:
        match = re.search(pattern, salary_str)
        if match:
            value = float(match.group(1))
            return value * 10000000  # Convert to actual amount
    
    # Handle formats like "5,00,000" or "500000" or "500,000"
    # Remove all commas and try to parse as number
    numeric_str = salary_str.replace(',', '').replace(' ', '')
    try:
        value = float(numeric_str)
        # If it's a reasonably large number, assume it's already in rupees
        if value >= 1000:
            return value
        # If it's small, might be in lakhs
        elif value > 0:
            return value * 100000
    except ValueError:
        pass
    
    return 0.0

# ----------------------------
# AI-based skill extraction
# ----------------------------
def extract_skills_from_text_ai(text: str, api_key: str) -> List[str]:
    """Extract skills from resume using AI instead of hardcoded patterns"""
    if not api_key or not text:
        return []
    
    prompt = f"""
You are an expert resume parser. Extract all technical and professional skills from the following resume text.

Return ONLY a JSON object with a single field "skills" containing an array of skill names.
Do not include explanations, just return the JSON.

Example format:
{{
  "skills": ["Python", "JavaScript", "React", "Machine Learning", "SQL"]
}}

Resume text:
{text[:3000]}
"""
    
    try:
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
        content = resp.json()["choices"][0]["message"]["content"]
        # Remove markdown code blocks if present
        content = re.sub(r"^```(json)?|```$", "", content.strip())
        result = json.loads(content)
        return result.get("skills", [])
    except Exception as e:
        print(f"AI skill extraction error: {e}")
        return []

# ----------------------------
# Experience calculation for given job title
# ----------------------------
MONTHS = {
    "jan": 1, "january":1, "feb":2, "february":2, "mar":3, "march":3,
    "apr":4, "april":4, "may":5, "jun":6, "june":6, "jul":7, "july":7,
    "aug":8, "august":8, "sep":9, "september":9, "oct":10, "october":10,
    "nov":11, "november":11, "dec":12, "december":12
}

def parse_year(s: str) -> Optional[int]:
    try:
        y = int(s)
        if 1900 <= y <= 2100:
            return y
    except:
        pass
    return None

def parse_date_from_text(part: str):
    part = part.strip()
    m = re.search(r"(?P<month>[A-Za-z]+)\s+[,]?\s*(?P<year>\d{4})", part)
    if m:
        mon = m.group("month").lower()
        yr = parse_year(m.group("year"))
        return (yr, MONTHS.get(mon, 0))
    m2 = re.search(r"(\d{4})", part)
    if m2:
        yr = parse_year(m2.group(1))
        return (yr, 0)
    return (None, 0)

def find_date_ranges(text: str) -> List[Dict]:
    ranges = []
    pattern = re.compile(r"""
        (?P<left>(?:[A-Za-z]{3,9}\s+\d{4}|\d{4}))
        \s*[-–—]\s*
        (?P<right>(?:[A-Za-z]{3,9}\s+\d{4}|\d{4}|Present|present))
    """, flags=re.VERBOSE)
    for m in pattern.finditer(text):
        left = m.group("left")
        right = m.group("right")
        sy, sm = parse_date_from_text(left)
        ey, em = (None, 0)
        if right.lower() in ("present",):
            ey, em = (pd.Timestamp.now().year, pd.Timestamp.now().month)
        else:
            ey, em = parse_date_from_text(right)
        if sy and ey:
            ranges.append({
                "start_year": sy,
                "start_month": sm,
                "end_year": ey,
                "end_month": em,
                "span": text[max(0,m.start()-120):m.end()+120],
                "span_indices": (m.start(), m.end())
            })
    return ranges

def compute_experience_for_title(text: str, job_title_input: str) -> float:
    if not text:
        return 0.0
    ranges = find_date_ranges(text)
    job_title_keywords = [w.lower() for w in re.findall(r"[A-Za-z0-9\-\+\.]+", job_title_input)] if job_title_input else []
    matched_years = []
    for r in ranges:
        ctx = r["span"].lower()
        if any(kw in ctx for kw in job_title_keywords):
            sy, ey = r["start_year"], r["end_year"]
            sm, em = r["start_month"], r["end_month"]
            if sy and ey:
                months = (ey - sy) * 12 + (em - sm)
                years = round(months / 12.0, 2)
                matched_years.append(years)
    if not matched_years and any(kw in job_title_input.lower() for kw in ["developer", "engineer", "analyst", "intern", "manager"]):
        if ranges:
            starts = [r["start_year"] for r in ranges if r["start_year"]]
            ends = [r["end_year"] for r in ranges if r["end_year"]]
            if starts and ends:
                years = max(ends) - min(starts)
                return float(max(0.0, round(years, 2)))
    elif not matched_years:
        return 0.0
    total = sum(matched_years)
    if total > 60:
        total = 60.0
    return float(round(total, 2))

# ----------------------------
# Improved Job Category Detection
# ----------------------------
def detect_job_category(job_title: str, openrouter_api_key: Optional[str] = None) -> str:
    if not job_title or not isinstance(job_title, str):
        return "Other"
    jt = job_title.lower().strip()
    category_map = {
        "tech": ["developer", "engineer", "software", "data", "ml", "ai", "blockchain", "cloud", "it", "cyber", "analyst",
                 "programmer", "full stack", "frontend", "backend", "system", "network"],
        "design/arts": ["artist", "designer", "graphic", "illustrator", "musician", "writer", "editor", "creative",
                        "ux", "ui", "photographer", "animator", "fashion"],
        "healthcare": ["doctor", "nurse", "medical", "dentist", "physician", "therapist", "surgeon", "pharmacist"],
        "finance": ["finance", "accountant", "bank", "investment", "trader", "auditor", "analyst", "tax"],
        "sales/marketing": ["sales", "marketing", "brand", "advertising", "growth", "business development"],
        "education": ["teacher", "professor", "lecturer", "trainer", "education", "counselor"],
        "legal": ["lawyer", "attorney", "legal", "advocate", "paralegal", "compliance"],
        "operations/management": ["manager", "operations", "project", "product", "supply chain", "logistics", "executive"],
        "hr/recruitment": ["hr", "recruiter", "talent", "human resource", "payroll"],
        "other": []
    }
    for cat, keywords in category_map.items():
        if any(k in jt for k in keywords):
            return cat.title()
    return "Other"

# ----------------------------
# AI parser - enhanced to include skills
# ----------------------------
def extract_resume_info_ai(text: str, api_key: str) -> Dict:
    if not api_key:
        print("No API key provided for AI parsing")
        return {}
    
    if not text or len(text.strip()) < 50:
        print(f"Text too short for parsing: {len(text)} chars")
        return {}
    
    prompt = f"""
You are an expert resume parser. Analyze the resume and return valid JSON with these fields:
- Job_Title: The current or most recent job title
- Education_Level: Highest education (e.g., "Bachelors", "Masters", "PhD", "High School")
- Location: City/State/Country
- Skills: An array of ALL technical and professional skills found (be comprehensive)

Return ONLY valid JSON, no explanations.

Resume:
{text[:4000]}
"""
    try:
        print(f"Sending resume text to AI (length: {len(text[:4000])} chars)...")
        resp = requests.post("https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": "gpt-4o-mini","messages": [{"role": "user","content": prompt}]}, timeout=20)
        
        resp_json = resp.json()
        print(f"AI Response status: {resp.status_code}")
        
        if "error" in resp_json:
            print(f"AI API Error: {resp_json['error']}")
            return {}
        
        content = resp_json["choices"][0]["message"]["content"]
        print(f"AI returned content (first 200 chars): {content[:200]}...")
        
        content = re.sub(r"^```(json)?|```$","",content.strip())
        parsed = json.loads(content)
        
        print(f"Parsed AI response: Job={parsed.get('Job_Title')}, Skills count={len(parsed.get('Skills', []))}")
        return parsed
    except Exception as e:
        print(f"AI parser error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return {}

# ----------------------------
# NEW: Serper.dev LinkedIn parser
# ----------------------------
def get_peer_comparisons(job_title: str, predicted_salary: float, experience_years: float) -> List[Dict]:
    """Find similar peers from dataset based on job title and salary range"""
    try:
        # Handle None or empty job title
        if not job_title or not isinstance(job_title, str):
            print(f"Invalid job_title for peer comparison: {job_title}")
            return []
        
        # Filter by similar job title (case insensitive)
        job_title_lower = job_title.lower().strip()
        similar_jobs = salary_dataset[
            salary_dataset['Job_Title'].str.lower().str.contains(job_title_lower, na=False, regex=False) |
            salary_dataset['Job_Title'].str.lower().str.strip().eq(job_title_lower)
        ]
        
        # If too few matches, try broader match
        if len(similar_jobs) < 5:
            # Extract key words from job title for broader matching
            keywords = job_title_lower.split()
            if keywords:
                pattern = '|'.join([re.escape(kw) for kw in keywords if len(kw) > 3])
                if pattern:
                    similar_jobs = salary_dataset[
                        salary_dataset['Job_Title'].str.lower().str.contains(pattern, na=False, regex=True)
                    ]
        
        if len(similar_jobs) == 0:
            return []
        
        # Calculate salary difference from predicted
        similar_jobs = similar_jobs.copy()
        similar_jobs['salary_diff'] = abs(similar_jobs['Salary_INR'] - predicted_salary)
        
        # Sort by salary difference to get closest matches
        closest_peers = similar_jobs.nsmallest(5, 'salary_diff')
        
        # Format peer data (anonymize)
        peer_list = []
        for idx, row in closest_peers.iterrows():
            peer_list.append({
                "job_title": row['Job_Title'],
                "experience_years": int(row['Experience_Years']),
                "education": row['Education_Level'],
                "location": row['Location'],
                "salary": round(float(row['Salary_INR']), 2),
                "skills": row['Skills_Required'] if pd.notna(row['Skills_Required']) else ""
            })
        
        return peer_list
    except Exception as e:
        print(f"Error getting peer comparisons: {e}")
        import traceback
        traceback.print_exc()
        return []

def extract_linkedin_info(url: str, serper_api_key: str) -> Dict:
    """Fetch LinkedIn info via Serper.dev + AI extraction"""
    try:
        search_q = f"site:linkedin.com/in {url}"
        headers = {"X-API-KEY": serper_api_key, "Content-Type": "application/json"}
        res = requests.post("https://google.serper.dev/search", headers=headers, json={"q": search_q}, timeout=20)
        res.raise_for_status()
        data = res.json()
        snippet = " ".join([r.get("snippet","") for r in data.get("organic",[])])
    except Exception as e:
        print("Serper.dev error:", e)
        return {}

    # parse snippet using AI
    try:
       
        ai_key = os.getenv("OPENROUTER_API_KEY")
        prompt = f"""
Extract JSON fields from this LinkedIn text:
- Job_Title
- Skills (comma separated)
- Education_Level
- Location
- Total_Experience_Years
Text:
{snippet}
"""
        resp = requests.post("https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {ai_key}", "Content-Type": "application/json"},
            json={"model": "gpt-4o-mini","messages":[{"role":"user","content":prompt}]}, timeout=25)
        txt = resp.json()["choices"][0]["message"]["content"]
        txt = re.sub(r"^```(json)?|```$","",txt.strip())
        return json.loads(txt)
    except Exception as e:
        print("AI LinkedIn parse fail:", e)
        return {}

# ----------------------------
# Endpoint
# ----------------------------
@app.post("/predict")
async def predict(
    file: Optional[UploadFile] = None,
    job_title: str = Form(None),
    linkedin_url: str = Form(None),
    openrouter_api_key: str = Form(None),
    current_salary: Optional[str] = Form(None)  # 🔹 Accept as string to parse various formats
):
    tmp_path = None
    try:
        # Parse salary input
        parsed_salary = parse_salary_input(current_salary) if current_salary else 0.0
        
        if linkedin_url:
            
            serper_key = os.getenv("SERPER_API_KEY")
            info = extract_linkedin_info(linkedin_url, serper_key)
            
            # Prioritize user input job title over LinkedIn-extracted title
            if job_title and job_title.strip():
                print(f"Using user-provided job title: {job_title}")
            else:
                job_title = info.get("Job_Title", "Other")
                print(f"Using LinkedIn-extracted job title: {job_title}")
            
            skills_str = ", ".join(info.get("Skills", [])) if isinstance(info.get("Skills"), list) else info.get("Skills","")
            education_level = info.get("Education_Level", "Bachelors")
            exp_years_for_role = float(info.get("Total_Experience_Years", 0))
            location = info.get("Location", "Other")
        else:
            suffix = "." + (file.filename.split(".")[-1] if file and "." in file.filename else "pdf")
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                tmp.write(await file.read())
                tmp_path = tmp.name
            text = extract_text_from_resume(tmp_path)
            
            # Check if text extraction was successful (after OCR attempts)
            if not text or len(text.strip()) < 50:
                return {
                    "status": "error",
                    "message": f"Unable to extract text from resume (only {len(text)} characters extracted). The file might be corrupted or in an unsupported format. Supported formats: PDF, DOCX, TXT, PNG, JPG, JPEG."
                }
            
            # Use hardcoded API key if not provided
            
            api_key_to_use = openrouter_api_key or os.getenv("OPENROUTER_API_KEY")

            
            # Extract info using AI (includes skills now)
            info = extract_resume_info_ai(text, api_key_to_use)
            
            # Get skills from AI response
            skills_list = info.get("Skills", [])
            if isinstance(skills_list, list):
                skills_str = ", ".join(skills_list)
            else:
                skills_str = str(skills_list) if skills_list else ""
            
            # Fallback: if no skills found, log it
            if not skills_str:
                print(f"Warning: No skills extracted. AI response: {info}")
                skills_str = ""
            
            # Prioritize user input job title over AI-extracted title
            if job_title and job_title.strip():
                # User provided job title - use it
                print(f"Using user-provided job title: {job_title}")
            else:
                # No user input - use AI-extracted title
                job_title = info.get("Job_Title", "Other")
                print(f"Using AI-extracted job title: {job_title}")
            
            # Ensure job_title is never None
            if not job_title or not isinstance(job_title, str):
                job_title = "Other"
                print(f"Job title was None/invalid, defaulting to: {job_title}")
            
            education_level = info.get("Education_Level", "Bachelors")
            location = info.get("Location", "Other")
            exp_years_for_role = compute_experience_for_title(text, job_title)
                    # ---------------------------
        # Validate job title input
        # ---------------------------
        try:
            job_title_lower = job_title.lower().strip() if job_title else ""

            invalid_titles = {
                "hi", "bye", "hello", "test", "aaa", "asdf", "qwerty",
                "sample", "random", "none", "na", "idk", "job", "title",
                "work", "employee", "abcd", "xyz", "xyz123"
            }

            # Check for invalid or vague titles
            if (
                not job_title_lower
                or len(job_title_lower) < 3
                or not re.search(r"[a-z]", job_title_lower)
                or job_title_lower in invalid_titles
                or re.fullmatch(r"[a-z]{2,4}", job_title_lower)  # handles short gibberish like "abc", "xyz"
                or re.match(r"^[a-z]+\d+$", job_title_lower)     # handles "abc123", "xyz123"
            ):
                print(f"⚠️ Invalid job title entered: {job_title}")
                return {
                    "status": "error",
                    "message": "Please enter a valid professional job title (e.g., 'Software Engineer', 'Data Analyst', 'Graphic Designer')."
                }

        except Exception as title_check_error:
            print(f"⚠️ Job title validation error: {title_check_error}")

            #domain
        # ---------------------------
        # Domain mismatch detection (strict)
        # ---------------------------
        try:
            mismatch_detected = False
            mismatch_reason = ""

            job_title_lower = job_title.lower().strip() if job_title else ""
            skills_lower = skills_str.lower().strip() if skills_str else ""

            # -----------------------
            # Domain keyword sets
            # -----------------------
            tech_keywords = ["python", "java", "developer", "engineer", "ai", "ml", "cloud", "data", "react", "node", "sql", "software"]
            healthcare_keywords = ["doctor", "nurse", "medical", "surgery", "patient", "clinic", "hospital", "health"]
            finance_keywords = ["finance", "accounting", "tax", "audit", "bank", "investment", "economics"]
            education_keywords = ["teacher", "professor", "lecturer", "trainer", "education", "school"]
            legal_keywords = ["law", "attorney", "advocate", "legal", "compliance", "paralegal"]
            design_keywords = ["designer", "artist", "creative", "ui", "ux", "graphics", "illustrator", "animation", "fashion"]
            sales_keywords = ["marketing", "sales", "advertising", "promotion", "branding", "customer", "retail"]
            ops_keywords = ["manager", "operations", "executive", "project", "product", "supply", "logistics", "coordinator"]

            def detect_domain(text: str) -> str:
                """Map text to a domain label."""
                text = text.lower()
                if any(k in text for k in tech_keywords): return "tech"
                if any(k in text for k in healthcare_keywords): return "healthcare"
                if any(k in text for k in finance_keywords): return "finance"
                if any(k in text for k in education_keywords): return "education"
                if any(k in text for k in legal_keywords): return "legal"
                if any(k in text for k in design_keywords): return "design"
                if any(k in text for k in sales_keywords): return "sales/marketing"
                if any(k in text for k in ops_keywords): return "management"
                return "other"

            job_domain = detect_domain(job_title_lower)
            skills_domain = detect_domain(skills_lower)

            # -----------------------
            # Detect vague job titles or mismatches
            # -----------------------
            # Condition 1: Nonsense or empty title (like "hi", "bye", "test", "123")
            if len(job_title_lower) < 3 or not re.search(r"[a-z]", job_title_lower) or job_domain == "other":
                mismatch_detected = True
                mismatch_reason = f"Job title '{job_title}' is too vague or not recognized as a valid professional role."

            # Condition 2: Valid title but skills domain mismatch
            elif job_domain != "other" and skills_domain != "other" and job_domain != skills_domain:
                mismatch_detected = True
                mismatch_reason = f"Job title domain ({job_domain}) does not match skills domain ({skills_domain})."

            # -----------------------
            # Return mismatch result
            # -----------------------
            if mismatch_detected:
                print(f"⚠️ Domain mismatch detected: {mismatch_reason}")
                return {
                    "status": "success",
                    "predicted_salary": "0 - 4 LPA",
                    "parsed_info": {
                        "Job_Title": job_title,
                        "Experience_Years": float(exp_years_for_role),
                        "Skills_Required": skills_str,
                        "Education_Level": education_level,
                        "Location": location,
                        "Category": job_domain
                    },
                    "comparison": {
                        "status": "mismatch",
                        "message": "Sorry, your salary cannot be determined as your job title does not match your resume skills or experience.",
                        "reason": mismatch_reason
                    },
                    "peer_comparisons": []
                }

        except Exception as mismatch_error:
            print(f"⚠️ Mismatch detection error: {mismatch_error}")


        job_cat = detect_job_category(job_title, openrouter_api_key)
        input_df = pd.DataFrame([{
            "Gender": "Other",
            "Job_Title": job_title,
            "Experience_Years": float(exp_years_for_role),
            "Skills_Required": skills_str,
            "Education_Level": education_level,
            "Location": location,
            "Data_Source": "LinkedIn" if linkedin_url else "ResumeUpload"
        }])
        log_pred = model.predict(input_df)[0]
        salary_pred = float(np.expm1(log_pred))

        # adjust salary
        category_scale = {
            "Tech": 1.0, "Design/Arts": 0.85, "Healthcare": 0.9, "Finance": 0.95,
            "Sales/Marketing": 0.8, "Education": 0.7, "Legal": 0.9,
            "Operations/Management": 0.9, "HR/Recruitment": 0.8, "Other": 0.75
        }
        scale = category_scale.get(job_cat, 0.8)
        adjusted_salary = salary_pred * scale * (1.12 ** max(0, exp_years_for_role))
        adjusted_salary = min(adjusted_salary, 60_00_000)

        # 🔹 Salary Comparison Logic
        comparison = {}
        if exp_years_for_role > 0 and parsed_salary > 0:
            if parsed_salary < adjusted_salary * 0.9:
                diff = adjusted_salary - parsed_salary
                comparison = {
                    "status": "underpaid",
                    "message": f"You are underpaid by ₹{diff:,.0f}.",
                    "reason": "Based on your skills, experience, and role, your compensation appears below market value.",
                    "suggested_salary": round(adjusted_salary, 2)
                }
            elif adjusted_salary * 0.9 <= parsed_salary <= adjusted_salary * 1.1:
                comparison = {
                    "status": "fair",
                    "message": "You are being paid fairly for your profile!",
                    "reason": "Your salary aligns well with market averages for similar experience and job roles."
                }
            else:
                comparison = {
                    "status": "overpaid",
                    "message": "You are earning above the expected range!",
                    "reason": "Your compensation is higher than most professionals with similar profiles — great job!"
                }
        elif exp_years_for_role == 0:
            comparison = {
                "status": "fresh",
                "message": f"Expected starting salary: ₹{adjusted_salary:,.0f}.",
                "reason": "This estimate is based on your education level and skills for an entry-level position."
            }
        
        # 🔹 Get peer comparisons
        peer_comparisons = get_peer_comparisons(job_title, adjusted_salary, exp_years_for_role)

        return {
            "status": "success",
            "predicted_salary": round(adjusted_salary, 2),
            "parsed_info": {
                "Job_Title": job_title,
                "Experience_Years": float(exp_years_for_role),
                "Skills_Required": skills_str,
                "Education_Level": education_level,
                "Location": location,
                "Category": job_cat
            },
            "comparison": comparison,  # 🔹 Salary comparison
            "peer_comparisons": peer_comparisons  # 🔹 NEW: Peer data from dataset
        }
    except Exception as e:
        print("Error in /predict:", e)
        return {"status": "error", "message": str(e)}
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

# ----------------------------
# AI Negotiation Coach Endpoints
# ----------------------------
class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    mode: Literal["coach", "mock_interviewer", "adaptive"] = "adaptive"
    profile: Optional[dict] = None

class ChatResponse(BaseModel):
    message: str

COACH_PROMPT = (
    """
    You are an expert salary negotiation coach. Your role is to provide strategic advice, guidance, and confidence to help users navigate salary discussions successfully.
    
    Your Expertise:
    - Negotiation strategies and tactics
    - Market research and salary benchmarking
    - Communication scripts for various scenarios
    - Building confidence and overcoming hesitation
    - Alternative compensation and benefits
    - Timing and approach recommendations
    
    Key Behaviors:
    - **Advisory Role**: You provide advice, not role-play. Guide the user on what to say and how to approach situations
    - **Strategic Thinking**: Help users understand their leverage, market position, and negotiation range
    - **Actionable Scripts**: Provide specific language they can use in emails, calls, or meetings
    - **Confidence Building**: Encourage assertiveness while maintaining professionalism
    - **Be Concise**: Keep responses focused, practical, and actionable (2-4 paragraphs max)
    - **Reference Data**: When appropriate, reference market trends and best practices
    - **Avoid Discrimination**: Never suggest reasoning based on protected characteristics
    
    Response Structure:
    1. Brief assessment of their situation
    2. Strategic recommendations
    3. Specific scripts or language they can use
    4. Key pitfalls to avoid
    
    Tone: Professional, confident, supportive, and empowering.
    """
).strip()

MOCK_INTERVIEWER_PROMPT = (
    """
    You are a realistic hiring manager or recruiter conducting a salary negotiation. Your role is to simulate a real negotiation scenario to help the user practice.
    
    Your Character:
    - Professional, measured, and business-focused
    - Represent the company's interests while being fair
    - Have budget constraints and approval processes
    - Ask clarifying questions about impact and justification
    - Provide realistic pushback without being hostile
    
    Key Behaviors:
    - **Stay In Character**: Always respond as the hiring manager/recruiter, not as a coach
    - **Realistic Constraints**: Reference budget bands, market rates, internal equity, approval processes
    - **Professional Pushback**: Challenge requests professionally ("Can you help me understand what drives that number?", "We need to stay within our budget band")
    - **Ask Follow-ups**: Probe about accomplishments, market research, alternative compensation
    - **Be Measured**: Don't immediately agree or reject; show consideration and business thinking
    - **Vary Responses**: Sometimes negotiate, sometimes hold firm, sometimes offer alternatives
    - **Be Concise**: Keep responses realistic in length (2-3 paragraphs)
    
    Simulation Guidelines:
    - Reference specific role, level, or company constraints when relevant
    - Mention need to discuss with leadership/HR when appropriate
    - Consider counter-offers, equity, bonuses, and other benefits
    - Show appreciation for their work while maintaining business needs
    
    Tone: Professional, measured, business-focused, and realistic.
    """
).strip()

ADAPTIVE_PROMPT = (
    """
    You are an intelligent, adaptive salary negotiation AI assistant. Your role is to understand what the user needs and respond accordingly.
    
    Based on the user's messages, you can:
    1. **Provide Coaching**: Offer negotiation strategies, scripts, market guidance, and confidence-building advice
    2. **Practice Mock Interviews**: Role-play as a hiring manager/recruiter with realistic pushback when the user wants to practice
    3. **Answer Questions**: Provide information about salary negotiation best practices
    4. **Analyze Situations**: Help users understand their position and options
    
    Key Behaviors:
    - **Adapt to Context**: If the user says "let's practice" or "act as my manager", switch to mock interview mode
    - If the user asks for advice, provide coaching and strategies
    - If the user shares their situation, analyze and offer personalized guidance
    - **Be Intelligent**: Understand user intent and respond appropriately
    - **Stay Professional**: Warm, confident, collaborative tone
    - **Be Concise**: Keep responses focused and actionable
    - **Use Market Data**: Reference credible sources, don't invent numbers
    - **Avoid Discrimination**: Never suggest reasoning based on protected characteristics
    
    When providing coaching:
    - Brief assessment of their situation
    - Negotiation strategy recommendations
    - Actionable scripts for email/chat/calls
    - Pitfalls to avoid and alternatives
    
    When mock interviewing:
    - Stay in character as hiring manager/recruiter
    - Provide realistic constraints (budget, bands, timeline)
    - Push back professionally without hostility
    - Ask follow-up questions about impact and scope
    
    Default tone: Warm, assertive, collaborative, and adaptive to user needs.
    """
).strip()

def build_system_prompt(mode: str, profile: Optional[dict]) -> str:
    # Select appropriate prompt based on mode
    if mode == "coach":
        base = COACH_PROMPT
    elif mode == "mock_interviewer":
        base = MOCK_INTERVIEWER_PROMPT
    else:
        base = ADAPTIVE_PROMPT
    
    profile_blob = json.dumps(profile or {}, ensure_ascii=False, indent=2)
    return (
        f"{base}\n\nUser profile/context (may be partial):\n{profile_blob}\n\n"
        "General safety: Avoid legal, medical, or financial advice beyond common professional norms."
    )

async def call_openrouter(messages: List[dict]) -> str:
    """Call OpenRouter API for AI responses"""
    
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

    
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8080",
        "X-Title": "PayParity Negotiation Coach",
    }
    
    payload = {
        "model": "openrouter/auto",
        "messages": messages,
        "temperature": 0.4,
        "top_p": 1,
        "max_tokens": 900,
    }
    
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, headers=headers, json=payload)
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        data = resp.json()
        try:
            content = data["choices"][0]["message"]["content"].strip()
        except Exception:
            raise HTTPException(status_code=500, detail=f"Unexpected API response: {data}")
        return content

@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """AI Negotiation Coach chat endpoint"""
    # Cap history for prompt budget
    history = req.messages[-12:]
    
    system_prompt = build_system_prompt(req.mode, req.profile)
    messages = [{"role": "system", "content": system_prompt}] + [m.dict() for m in history]
    
    # Basic validation: ensure last message is user
    if not messages or messages[-1]["role"] != "user":
        raise HTTPException(status_code=400, detail="Last message must be from user")
    
    reply = await call_openrouter(messages)
    return ChatResponse(message=reply)

# ----------------------------
# Run
# ----------------------------
if __name__ == "__main__":
    uvicorn.run(
        app,
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000))
    )
