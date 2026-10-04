"""סוכן איתור לקוחות לתדיראן טלקום — מחקר ודירוג בלבד, בלי שליחת הודעות.

שימוש: python agent.py [--sector "ביטוח ופנסיה"] [--limit 5]
"""
import argparse, json, re, datetime, pathlib, sys
import yaml
from anthropic import Anthropic
from dotenv import load_dotenv
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment

load_dotenv()
HERE = pathlib.Path(__file__).parent
MODEL = "claude-sonnet-5-5"
SEEN = HERE / "seen.json"
client = Anthropic()
TOOLS = [{"type": "web_search_20250305", "name": "web_search", "max_uses": 8}]


def ask_json(prompt: str):
    """קריאה ל-Claude עם חיפוש ווב; מחזירה JSON שנשלף מהתשובה."""
    messages = [{"role": "user", "content": prompt}]
    for _ in range(6):  # pause_turn = הכלי עדיין רץ, ממשיכים
        resp = client.messages.create(model=MODEL, max_tokens=4096, tools=TOOLS, messages=messages)
        if resp.stop_reason != "pause_turn":
            break
        messages += [{"role": "assistant", "content": resp.content}]
    text = "".join(b.text for b in resp.content if b.type == "text")
    m = re.search(r"(\[.*\]|\{.*\})", text, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None


def discover(icp, sector, seen):
    prompt = f"""אתה חוקר מכירות B2B של תדיראן טלקום ({icp['product']}).
חפש ברשת {icp['per_sector_candidates']} חברות בישראל בענף "{sector}" עם {icp['employees_min']}-{icp['employees_max']} עובדים
שמפעילות מוקד שירות או מכירות משמעותי. השתמש רק במקורות ציבוריים.
דלג על: {', '.join(sorted(seen)) or 'אין'}.
החזר JSON בלבד: רשימה של {{"name": "...", "website": "..."}}."""
    return ask_json(prompt) or []


def research(icp, company, sector):
    prompt = f"""חקור את החברה "{company['name']}" ({company.get('website','')}), ענף {sector}, בישראל,
כלקוחה פוטנציאלית של תדיראן טלקום ({icp['product']}). מקורות ציבוריים בלבד.
בדוק: מספר עובדים (הערכה, ציין מקור), גודל מוקד, משרות פתוחות לנציגים/מוקד, ערוצי שירות באתר
(WhatsApp/צ'אט/מייל/טלפון), ספק מוקד נוכחי אם פורסם, וסיגנלים: {'; '.join(icp['signals'])}.
אל תמציא נתונים — אם לא נמצא כתוב "לא ידוע". אל תנחש כתובות מייל או טלפונים.
ציון 0-100 = התאמה ל-Omnichannel + ענן (גודל מוקד, פיצול ערוצים, כאב, תזמון).
החזר JSON בלבד עם המפתחות:
name, sector, employees_estimate (מספר או null), employees_source, contact_center_notes,
channels_today, pain_signals (רשימה), contact_role (תפקיד רלוונטי ושם אם פורסם ציבורית, אחרת null),
score (מספר), rationale (משפט או שניים בעברית), sources (רשימת URL)."""
    return ask_json(prompt)


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
