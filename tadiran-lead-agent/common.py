"""כלים משותפים: חיפוש DuckDuckGo חינמי, קריאת דפים, וקריאה ל-Gemini (שכבה חינמית)."""
import json, os, re, sys, time
import requests
from dotenv import load_dotenv
try:
    from ddgs import DDGS
except ImportError:  # השם הישן של החבילה
    from duckduckgo_search import DDGS

load_dotenv()
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
UA = {"User-Agent": "Mozilla/5.0"}


def search(query, n=6):
    """חיפוש חינמי בלי מפתח. מחזיר טקסט עם [URL] כותרת: תקציר לכל תוצאה."""
    for attempt in range(3):
        try:
            res = DDGS().text(query, region="il-he", max_results=n)
            return "\n".join(f"[{r['href']}] {r['title']}: {r['body']}" for r in res)
        except Exception:
            time.sleep(2 * (attempt + 1))
    return ""


def fetch(url, limit=3000):
    try:
        html = requests.get(url, headers=UA, timeout=10).text
    except Exception:
        return ""
    html = re.sub(r"(?s)<(script|style).*?</\1>", " ", html)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))[:limit]


def ask_json(prompt):
    """קריאה ל-Gemini שמחזירה JSON; מנסה שוב במגבלת קצב."""
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        sys.exit("חסר GEMINI_API_KEY (מפתח חינמי: aistudio.google.com/apikey)")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2}}
    for attempt in range(5):
        r = requests.post(url, params={"key": key}, json=body, timeout=90)
        if r.status_code == 429 or r.status_code >= 500:
            time.sleep(15 * (attempt + 1))
            continue
        if r.status_code != 200:
            print(f"שגיאת Gemini {r.status_code}", file=sys.stderr)
            return None
        try:
            return json.loads(r.json()["candidates"][0]["content"]["parts"][0]["text"])
        except (KeyError, IndexError, json.JSONDecodeError):
            return None
    return None
