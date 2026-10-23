# התקציב שלנו

אפליקציית תקציב זוגית בעברית (RTL), PWA, Next.js (App Router) + Supabase. כל תנועה פרטית כברירת מחדל; רק תנועה שסומנה "משותף" נראית לבן/בת הזוג. הפרטיות נאכפת ברמת מסד הנתונים (Row Level Security).

> סטטוס: **שלב 1 (ליבה אישית)**. תקציב חכם, אזור משותף מלא, תובנות וייבוא קבצים יתווספו בשלבים הבאים.

## הרצה מקומית

```bash
npm install
cp .env.example .env.local   # ממלאים URL ומפתח ציבורי (anon/publishable) של Supabase
npm run dev
```

בלי `.env.local` האפליקציה מציגה מסך הנחיות במקום לקרוס.

## הגדרת Supabase (תוכנית Free)

1. פותחים פרויקט ב-[supabase.com](https://supabase.com).
2. מריצים את קבצי `supabase/migrations/*.sql` לפי סדר השמות (ב-SQL Editor, או `supabase db push` עם ה-CLI).
3. ב-Authentication → URL Configuration מוסיפים את כתובת האתר (`http://localhost:3000` ודומיין הפריסה) ל-Redirect URLs.
4. כניסה מהמסך המותקן: ב-Authentication → Email Templates (Magic Link) מוסיפים לגוף המייל גם את `{{ .Token }}`, כך אפשר להקליד את הקוד באפליקציה במקום ללחוץ על הקישור.
5. אופציונלי: `supabase/seed.sql` מוסיף נתוני דמה אחרי שנרשמתם ויצרתם משק בית.

## בדיקות

```bash
npm run test:unit   # חישובי כסף (אגורות) וחודש פיננסי
npm run test:rls    # מרים Postgres זמני, מריץ את המיגרציות ומוכיח שמשתמש ב' לא קורא נתון פרטי של א'
npm run lint && npm run typecheck && npm run build
```

בדיקות ה-RLS רצות מול Postgres רגיל עם shim קטן שמדמה את `auth.uid()` ואת התפקידים של Supabase (`tests/rls/shim.sql`). אפשר גם להצביע על מסד אחר עם `TEST_DATABASE_URL`.

## פריסה ל-Vercel

מייבאים את הריפו, מגדירים `NEXT_PUBLIC_SUPABASE_URL` ו-`NEXT_PUBLIC_SUPABASE_ANON_KEY`, ופורסים. אין מפתחות סודיים בצד הלקוח.

## עקרונות

- סכומים: אגורות כמספרים שלמים בלבד (`src/lib/money.ts`).
- חודש פיננסי: ברירת מחדל מה-10 עד ה-9 (`src/lib/period.ts`), ניתן לשינוי בהגדרות; משפיע רק על חישובים.
- RLS על כל טבלה; אין views או RPC שמסכמים שורות פרטיות של אחרים.
- אין שמירת פרטי בנק/אשראי, אין חיבור לארנק, SMS או התראות.
