"""מיילים דרך SMTP של Gmail (חינמי; App Password). אם לא הוגדר, מדלגים."""
import html, os, smtplib
from email.message import EmailMessage


def configured():
    return all(os.getenv(k) for k in ("GMAIL_USER", "GMAIL_APP_PASSWORD", "NOTIFY_TO"))


def _row(l):
    src = " ".join(f'<a href="{html.escape(u)}">מקור</a>' for u in (l.get("sources") or [])[:3])
    return (f"<tr><td><b>{html.escape(str(l.get('name','')))}</b></td><td>{l.get('score')}</td>"
            f"<td>{l.get('employees_estimate') or 'לא ידוע'} ({l.get('employees_confidence')})</td>"
            f"<td>{html.escape(str(l.get('rationale','')))}</td><td>{src}</td></tr>")


def build(leads, hot_min, subject_prefix="עדכון לידים"):
    hot = [l for l in leads if (l.get("score") or 0) >= hot_min]
    rows = "".join(_row(l) for l in sorted(leads, key=lambda x: -(x.get("score") or 0)))
    body = (f'<div dir="rtl" style="font-family:Arial"><h2>{subject_prefix}: {len(leads)} לידים חדשים, '
            f'{len(hot)} חמים (ציון {hot_min}+)</h2>'
            '<table border="1" cellpadding="6" style="border-collapse:collapse"><tr><th>חברה</th><th>ציון</th>'
            f'<th>עובדים</th><th>נימוק</th><th>מקורות</th></tr>{rows}</table>'
            '<p>גודל וניתוח הם הערכה ממקורות ציבוריים. יש לאמת לפני פנייה. פסילת ליד נעשית בדשבורד.</p></div>')
    return f"{subject_prefix}: {len(leads)} חדשים ({len(hot)} חמים)", body


def send(leads, hot_min=80):
    if not leads or not configured():
        return False
    subject, body = build(leads, hot_min)
    msg = EmailMessage()
    msg["Subject"], msg["From"], msg["To"] = subject, os.environ["GMAIL_USER"], os.environ["NOTIFY_TO"]
    msg.set_content("הודעה זו מכילה טבלת HTML.")
    msg.add_alternative(body, subtype="html")
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
        s.login(os.environ["GMAIL_USER"], os.environ["GMAIL_APP_PASSWORD"])
        s.send_message(msg)
    return True
