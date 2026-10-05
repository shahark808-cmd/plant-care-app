# חוזה לדשבורד (למי שבונה אותו)
- **מקור נתונים:** טבלת `leads` ב-Supabase (`supabase/schema.sql`).
- **מפתחות בדשבורד:** רק `SUPABASE_URL` ו-anon key. **לעולם לא service_role.**
- **התחברות:** Supabase Auth (מייל/magic link) לאבא. בלי התחברות ה-RLS חוסם הכול.
- **קריאה:** `select * from leads where status='new' order by score desc`.
- **פסילה:** `update leads set status='rejected', reject_reason='...' where id=...` (מותר לעדכן רק שני העמודות האלה).
- **סינון מומלץ:** `employees_confidence` (verified/estimated/unknown) כדי לראות מה דורש בדיקה ידנית.
- הסוכן לא מציע שוב ליד שנפסל, ומתחשב בסיבות הפסילה בדירוג.
