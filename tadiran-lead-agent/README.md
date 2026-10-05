# סוכן איתור לקוחות — תדיראן טלקום

מחקר ודירוג חברות בישראל (200–2000 עובדים, מוקדי שירות/מכירות) כלקוחות ל-Omnichannel וענן.
מקורות ציבוריים בלבד; הסוכן לא שולח הודעות ולא מנחש מיילים/טלפונים.

```bash
pip install -r requirements.txt
cp .env.example .env        # להדביק GEMINI_API_KEY (חינמי: aistudio.google.com/apikey)
python agent.py --sector "ביטוח ופנסיה" --limit 5   # ריצת ניסוי
python agent.py                                     # כל הענפים
```
הפלט: `leads_YYYY-MM-DD.xlsx` ממוין לפי ציון. `icp.yaml` מגדיר ענפים, טווח גודל וסיגנלים.
`seen.json` מונע כפילויות בין ריצות (למחוק כדי להתחיל מחדש).
כל נתון שהסוכן מצטט נבדק ידנית לפני פנייה; מספר עובדים הוא הערכה.

## עלות: אפס
חיפוש: DuckDuckGo (בלי מפתח). ניתוח: Gemini בשכבה החינמית (מגבלת קצב, הסוכן ממתין ומנסה שוב; ריצה על כל הענפים יכולה לקחת זמן).
האיכות נמוכה מעט מחיפוש בתשלום: DuckDuckGo נותן תוצאות מועטות ולפעמים נחסם זמנית.

## v2: מקורות מרובים, Supabase, מייל
- מקורות: דרושים, מכרזים, מאיה/Dun's 100, רשם החברות (data.gov.il) לאימות קיום.
- כל ליד מסומן `employees_confidence`: verified / estimated / unknown.
- Supabase: להריץ `supabase/schema.sql`, להגדיר `SUPABASE_URL` ו-`SUPABASE_SERVICE_KEY` (סודי). בלעדיהם נכתב Excel מקומי.
- מייל: `GMAIL_USER`, `GMAIL_APP_PASSWORD` (App Password, דורש אימות דו-שלבי), `NOTIFY_TO`. התראה כוללת את הלידים החדשים וציון 80+ כחמים.
- הרצה מתוזמנת: `.github/workflows/leads.yml` (שבועי). לשים את הסודות ב-GitHub Secrets.
- דשבורד: ראו `docs/DASHBOARD.md`.

שם השולח במייל נקבע ב-`MAIL_FROM_NAME` (ברירת מחדל: מוטי).

מילוי .env בשאלות: `python setup_env.py`
