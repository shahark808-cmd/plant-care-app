# יומן אימונים — PWA אישית (כוח, ריצה, תזונה)

אפליקציית ווב (PWA) בעברית, RTL, mobile-first, למשתמש יחיד. כל הקוד ב-`fitness/` (יש לה `package.json` משלה). פירוט מלא של התכונות וההחלטות: `fitness/README.md`.

> **היסטוריה:** הריפו שימש בעבר לאפליקציית טיול לקוריאה ולפרויקט "טיפוח הצמחים". שניהם הוסרו, וההיסטוריה שלהם נשארה ב-git.

## החלטות ארכיטקטורה

- **Vite + React + TypeScript**, SPA, `react-router-dom`, פיצול קוד לפי מסך (`React.lazy`). CSS רגיל עם משתני עיצוב ב-`src/index.css` (בהיר/כהה, ניגודיות AA). אין Tailwind.
- **Offline-first:** IndexedDB דרך Dexie (`src/lib/db.ts`), ו-service worker דרך `vite-plugin-pwa`. הגופן Heebo מתארח באפליקציה.
- **אלגוריתמים כפונקציות טהורות עם בדיקות** (`vitest`): התקדמות במשקל (`lib/progression.ts`), תזונה (`lib/nutrition.ts`), ריצה (`lib/running.ts`), דגשים ורצף (`lib/insights.ts`). כל הספים ניתנים לעריכה בהגדרות ולא מקודדים.
- **Supabase (פרויקט `fitness`) רק ל-Strava:** טבלאות `strava_tokens` (RLS בלי policies, שרת בלבד) ו-`strava_runs`, ופונקציית Edge `strava` (`fitness/supabase/`). הטוקנים והסודות אף פעם לא מגיעים ללקוח.
- **דגשי מחקר:** מאגר קבוע ב-`src/data/insights.ts`. כל ציטוט אומת מול PubMed. אין להוסיף ציטוט שלא אומת.
- **אין ייעוץ רפואי.** תוכן כללי בלבד, עם הפניה לאיש מקצוע בכאב או פציעה.

## פקודות (מתוך `fitness/`)

```bash
npm run dev       # פיתוח
npm test          # בדיקות יחידה
npm run build     # tsc + build + service worker
npm run lint      # oxlint
```

## משתני סביבה

ציבוריים בלבד (ראו `fitness/.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_STRAVA_CLIENT_ID`. סודות (`STRAVA_CLIENT_SECRET`, `STRAVA_VERIFY_TOKEN`) רק ב-Supabase Secrets. שום סוד לא נכנס לקוד, ל-git או לצ'אט.

## פריסה

Vercel, פרויקט `fitness-app` (Root Directory: `fitness`). בנייה רק מהענף `claude/serene-dirac-a5o4j2` ומ-`main` (הגדרת Ignored Build Step).

## מוסכמות

- כל הטקסט למשתמש בעברית. הודעות שגיאה תמיד מנוסחות מחדש בעברית, לא גולמיות מה-API.
- אזורי מגע של 44px לפחות, אנימציות עדינות שמכבדות `prefers-reduced-motion`, ללא אימוג'י בממשק.
- לפני שינוי בצבעים או ברכיבים: להריץ בדיקת נגישות (axe) על המסכים הראשיים.
