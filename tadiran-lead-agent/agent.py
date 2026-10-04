"""סוכן איתור לקוחות לתדיראן טלקום — חינמי לגמרי (DuckDuckGo + Gemini free tier).
מחקר ודירוג בלבד, בלי שליחת הודעות.

שימוש: python agent.py [--sector "ביטוח ופנסיה"] [--limit 5]
"""
import argparse, json, re, datetime, pathlib, sys, time, os
import requests, yaml
from dotenv import load_dotenv
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment
try:
    from ddgs import DDGS
except ImportError:  # השם הישן של החבילה
    from duckduckgo_search import DDGS

load_dotenv()
HERE = pathlib.Path(__file__).parent
MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
KEY = os.getenv("GEMINI_API_KEY")
SEEN = HERE / "seen.json"
JOB_SITES = ("alljobs.co.il", "drushim.co.il", "jobmaster.co.il")
COMPETITORS = ("Genesys", "NICE", "Verint", "Avaya", "Cisco Webex Contact Center")
UA = {"User-Agent": "Mozilla/5.0"}


def search(query, n=6):
    """חיפוש DuckDuckGo חינמי, בלי מפתח. מחזיר טקסט מקוצר עם URL לכל תוצאה."""
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
    """קריאה ל-Gemini (שכבה חינמית) שמחזירה JSON. מנסה שוב כשחורגים ממגבלת הקצב."""
    if not KEY:
        sys.exit("חסר GEMINI_API_KEY ב-.env (מפתח חינמי: aistudio.google.com/apikey)")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2}}
    for attempt in range(5):
        r = requests.post(url, params={"key": KEY}, json=body, timeout=90)
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


def discover(icp, sector, seen):
    ctx = "\n".join(search(q) for q in (
        f"חברות גדולות בישראל ענף {sector} מוקד שירות לקוחות",
        f"הגדולות ב{sector} בישראל מספר עובדים",
        f"דרושים נציג שירות לקוחות {sector} חברה",
        *(f"{d} {sector}" for d in ("site:alljobs.co.il נציג שירות", "site:drushim.co.il נציג שירות")),
        *(f"לקוחות {c} ישראל {sector}" for c in COMPETITORS)))
    prompt = f"""אתה חוקר מכירות B2B של תדיראן טלקום ({icp['product']}).
מתוצאות החיפוש הבאות, חלץ עד {icp['per_sector_candidates']} חברות ישראליות בענף "{sector}"
שסביר שיש להן {icp['employees_min']}-{icp['employees_max']} עובדים ומוקד שירות/מכירות. רק חברות שמופיעות בתוצאות.
דלג על: {', '.join(sorted(seen)) or 'אין'}.
החזר JSON: רשימה של {{"name": "...", "website": "..."}} (website ריק אם לא מופיע).

תוצאות:
{ctx}"""
    r = ask_json(prompt)
    return r if isinstance(r, list) else []


def research(icp, company, sector):
    n = company["name"]
    site = fetch(company["website"]) if company.get("website", "").startswith("http") else ""
    ctx = "\n".join(search(q, 5) for q in (
        f"{n} מספר עובדים", f"{n} שירות לקוחות וואטסאפ צ'אט",
        f"{n} מכרז מוקד OR ענן OR גיוס OR מנהל חדש",
        f"{n} דוח שנתי מספר עובדים site:maya.tase.co.il OR site:tase.co.il",
        *(f"{n} נציג שירות מוקד site:{d}" for d in JOB_SITES)))
    prompt = f"""נתח את החברה "{n}" (ענף {sector}, ישראל) כלקוחה פוטנציאלית של תדיראן טלקום ({icp['product']}).
השתמש אך ורק במידע שלהלן. אל תמציא; אם אין מידע כתוב "לא ידוע" או null. אל תנחש מיילים/טלפונים.
סיגנלים לחיפוש: {'; '.join(icp['signals'])}.
ציון 0-100 = התאמה (גודל מוקד, פיצול ערוצים, כאב, תזמון). בלי עדות לגודל המוקד, ציון נמוך מ-50.
החזר JSON עם המפתחות: name, sector, employees_estimate (מספר או null), employees_source,
contact_center_notes, channels_today, pain_signals (רשימת מחרוזות), contact_role (תפקיד/שם שפורסם ציבורית או null),
score (מספר), rationale (1-2 משפטים בעברית), sources (רשימת URL מתוך התוצאות בלבד).

תוכן האתר: {site}

תוצאות חיפוש:
{ctx}"""
    r = ask_json(prompt)
    return r if isinstance(r, dict) else None


def in_range(lead, icp):
    n = lead.get("employees_estimate")
    return n is None or icp["employees_min"] <= n <= icp["employees_max"]


COLS = [("name", "חברה"), ("sector", "ענף"), ("employees_estimate", "עובדים (משוער)"),
        ("score", "ציון"), ("rationale", "נימוק"), ("pain_signals", "סימני כאב"),
        ("channels_today", "ערוצים כיום"), ("contact_center_notes", "מוקד"),
        ("contact_role", "איש קשר מוצע"), ("employees_source", "מקור גודל"), ("sources", "מקורות")]


def export(leads):
    wb = Workbook(); ws = wb.active; ws.title = "לידים"; ws.sheet_view.rightToLeft = True
    ws.append([h for _, h in COLS])
    for c in ws[1]:
        c.font = Font(bold=True)
    for l in sorted(leads, key=lambda x: -(x.get("score") or 0)):
        row = [", ".join(v) if isinstance(v := l.get(k), list) else v for k, _ in COLS]
        ws.append(row)
    for col, w in zip("ABCDEFGHIJK", [22, 18, 14, 8, 50, 40, 28, 30, 28, 28, 50]):
        ws.column_dimensions[col].width = w
    for r in ws.iter_rows(min_row=2):
        for c in r:
            c.alignment = Alignment(wrap_text=True, vertical="top")
    path = HERE / f"leads_{datetime.date.today()}.xlsx"
    wb.save(path)
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sector", help="ענף בודד במקום כל הענפים")
    ap.add_argument("--limit", type=int, help="מקסימום חברות לענף")
    args = ap.parse_args()
    icp = yaml.safe_load((HERE / "icp.yaml").read_text(encoding="utf-8"))
    if args.limit:
        icp["per_sector_candidates"] = args.limit
    sectors = [args.sector] if args.sector else icp["sectors"]
    seen = set(json.loads(SEEN.read_text(encoding="utf-8"))) if SEEN.exists() else set()
    leads = []
    for sector in sectors:
        print(f"== {sector}", file=sys.stderr)
        for cand in discover(icp, sector, seen):
            name = cand.get("name")
            if not name or name in seen:
                continue
            lead = research(icp, cand, sector)
            seen.add(name)
            if not lead or not in_range(lead, icp) or (lead.get("score") or 0) < icp["min_score"]:
                print(f"  - {name}: נדחתה", file=sys.stderr)
                continue
            print(f"  + {name}: {lead['score']}", file=sys.stderr)
            leads.append(lead)
    SEEN.write_text(json.dumps(sorted(seen), ensure_ascii=False), encoding="utf-8")
    print(f"נשמר: {export(leads)} ({len(leads)} לידים)")


if __name__ == "__main__":
    main()
