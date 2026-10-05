"""מילוי קובץ .env בשאלות. הסיסמאות מוקלדות בלי הד למסך ונשמרות רק אצלך במחשב.
שימוש: python setup_env.py"""
import getpass, pathlib

HERE = pathlib.Path(__file__).parent
FIELDS = [
    ("GEMINI_API_KEY", "מפתח Gemini (מתחיל ב-AIza)", True, None),
    ("SUPABASE_URL", "כתובת Supabase", False, "https://ktoehqglpzkglytlopxd.supabase.co"),
    ("SUPABASE_SERVICE_KEY", "מפתח סודי של Supabase (service_role/secret)", True, None),
    ("GMAIL_USER", "כתובת ה-Gmail של מוטי", False, None),
    ("GMAIL_APP_PASSWORD", "סיסמת אפליקציה של מוטי (16 תווים)", True, None),
    ("NOTIFY_TO", "מייל שמקבל את העדכונים (לבדיקה: המייל שלך)", False, None),
    ("MAIL_FROM_NAME", "שם השולח", False, "מוטי"),
]

values = {}
print("אפשר ללחוץ Enter כדי לדלג (למשל Supabase, אם רוצים רק קובץ Excel).\n")
for key, label, secret, default in FIELDS:
    prompt = f"{label}" + (f" [{default}]" if default else "") + ": "
    v = getpass.getpass(prompt).replace(" ", "") if secret else input(prompt).strip()
    values[key] = v or default or ""

(HERE / ".env").write_text("".join(f"{k}={v}\n" for k, v in values.items()), encoding="utf-8")
print("\nנשמר ב-.env (הקובץ לא עולה ל-git).")
