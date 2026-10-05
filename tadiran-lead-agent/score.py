"""דירוג לידים ב-Gemini, רק על הראיות שנאספו. לא ממציאים נתונים."""
from common import ask_json
from persona import STYLE


def discover_candidates(icp, sector, context, known):
    prompt = f"""אתה חוקר מכירות B2B של תדיראן טלקום ({icp['product']}).
מתוך הטקסט, חלץ עד {icp['per_sector_candidates']} חברות ישראליות בענף "{sector}" שסביר שיש להן
{icp['employees_min']}-{icp['employees_max']} עובדים ומוקד שירות/מכירות. העדף חברות פחות מוכרות שמגייסות הרבה נציגים.
רק חברות שמופיעות בטקסט (לא סוכנויות גיוס, לא מתחרים כמו Genesys/NICE). דלג על: {', '.join(sorted(known)[:200]) or 'אין'}.
החזר JSON: רשימה של {{"name": "...", "website": "..."}} (website ריק אם לא מופיע).

{context}"""
    r = ask_json(prompt)
    return r if isinstance(r, list) else []


def rate(icp, company, sector, evidence, reject_reasons):
    lessons = "\n".join(f"- {r}" for r in reject_reasons[-15:]) or "אין עדיין"
    prompt = f"""נתח את "{company['name']}" (ענף {sector}, ישראל) כלקוחה של תדיראן טלקום ({icp['product']}).
השתמש אך ורק בראיות. אל תמציא; אם אין מידע כתוב "לא ידוע"/null. אל תנחש מיילים או טלפונים.
סיגנלים: {'; '.join(icp['signals'])}.\nסגנון הכתיבה של הנימוק: {STYLE}
סיבות שאבא פסל לידים בעבר (התחשב בהן בדירוג):
{lessons}
ציון 0-100 = התאמה (גודל מוקד, פיצול ערוצים, כאב, תזמון). בלי עדות לגודל המוקד, ציון מתחת ל-50.
employees_confidence: "verified" רק אם יש מספר עובדים במקור ציבורי; "estimated" אם רק רמז; אחרת "unknown".
החזר JSON עם: name, sector, employees_estimate (מספר או null), employees_confidence, employees_source,
contact_center_notes, channels_today, pain_signals (רשימת מחרוזות), contact_role (תפקיד/שם שפורסם או null),
score (מספר), rationale (1-2 משפטים בעברית בסגנון מוטי, ראו להלן, ורק לפי העובדות), sources (רשימת URL מתוך הראיות בלבד).

ראיות:
{evidence}"""
    r = ask_json(prompt)
    return r if isinstance(r, dict) else None
