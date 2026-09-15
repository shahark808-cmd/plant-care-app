# טיפוח הצמחים — Plant Care PWA

אפליקציית ווב (PWA) אישית לזוג (שני משתמשי אייפון) לניהול משותף של השקיית צמחי בית. בלי חומרה, בלי חיישנים — רק מעקב, תזכורות, ויומן בריאות לצמחים. מותקנת למסך הבית באייפון (Add to Home Screen), לא אפליקציה נייטיב.

## החלטות ארכיטקטורה

- **Vite + React + TypeScript, לא Next.js** — זו אפליקציית SPA טהורה שרצה כ-static hosting על Vercel מול Supabase; אין צורך ב-SSR, ופחות מורכבות לתחזוקה עבור בעלים שאינם מתכנתים מקצועיים.
- **Tailwind CSS v4** (`@tailwindcss/vite`) — אין `tailwind.config.js` נפרד; ההגדרות ב-CSS עצמו (`@import 'tailwindcss'`). RTL מלא: `dir="rtl" lang="he"` על ה-`<html>`.
- **Supabase** ל-Auth (magic link), Postgres, Storage (תמונות), Realtime (סנכרון בין שני המשתמשים). למה לא Firebase: Postgres + RLS נותנים שליטה מדויקת על "מי רואה מה" ברמת שורה, וזה בדיוק המודל שצריך כאן (household-scoped data).
- **Web Push (VAPID) + Supabase Edge Function + pg_cron** להתראות — לא native push, כי אין אפליקציה נייטיב.
- **Open-Meteo** למזג אוויר — חינמי, בלי מפתח API.
- **בלי סוויטת בדיקות אוטומטית** — פרויקט אישי לשני משתמשים; כל שלב נבדק ידנית באייפון. חריג: `src/lib/weather/adjustFrequency.ts` נשאר פונקציה טהורה ומבודדת (בלי תלות ב-React/Supabase) כדי שיהיה קל לבדוק ולכוון אותה ידנית.

## מבנה תיקיות

```
public/icons/         # אייקוני PWA (192, 512, maskable, apple-touch-icon)
src/routes/           # מסך לכל route (Today, Plants, PlantDetail, History, Settings, Login, Onboarding)
src/components/layout/  # BottomNav, InstallPrompt
src/components/plants/  # (יתווסף בשלב 3)
src/components/watering/ # (יתווסף בשלב 4)
src/components/journal/  # (יתווסף בשלב 7)
src/lib/pwa/           # רישום ה-service worker
src/lib/supabase.ts    # (יתווסף בשלב 2) — לקוח Supabase יחיד
src/lib/weather/       # (יתווסף בשלב 6) — מודול התאמת השקיה למזג אוויר, פונקציה טהורה
src/hooks/              # hooks ל-realtime ול-session (יתווספו משלב 2)
src/types/              # טיפוסים, כולל database.types.ts שנוצר אוטומטית מ-Supabase
supabase/migrations/    # קבצי SQL לכל שינוי סכימה
supabase/functions/     # Edge Functions (Deno) — send-daily-reminders יתווסף בשלב 5
scripts/generate-icons.ps1  # סקריפט שיצר את אייקוני ה-PWA הזמניים (placeholder)
```

## פקודות

```bash
npm run dev       # שרת פיתוח מקומי
npm run build     # בדיקת טיפוסים (tsc -b) + build לפרודקשן
npm run preview   # תצוגה מקדימה של ה-build
npm run lint       # oxlint
```

פקודות Supabase שיתווספו משלב 2 (יתועדו כאן כשיגיעו): `supabase start`, `supabase db push`, `supabase gen types typescript --local > src/types/database.types.ts`, `supabase functions deploy send-daily-reminders`.

## משתני סביבה

עדיין אין (יתווספו בשלב 2: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). **כלל קבוע: שום מפתח או סוד לא נכנס לקוד או ל-git** — הכול ב-`.env` מקומי (ב-`.gitignore`) ובמשתני סביבה של Vercel/Supabase.

## מודל נתונים

עדיין לא נוצר (יתווסף בשלב 2 ואילך). הטבלאות המתוכננות: `households`, `household_members`, `plants`, `watering_events`, `plant_logs`, `push_subscriptions`, `settings` — כולן עם Row Level Security לפי חברות ב-household. קבצי המיגרציה ב-`supabase/migrations/` הם מקור האמת.

## יומן שלבים

### שלב 1 — שלד הפרויקט, PWA, פריסה ל-Vercel (2026-09-15)
נבנה: Vite+React+TS+Tailwind v4, RTL בסיסי, ניווט תחתון (BottomNav) עם 4 מסכי placeholder (היום/צמחים/היסטוריה/הגדרות) + מסכי login/onboarding נוספים, PWA מלא דרך `vite-plugin-pwa` (manifest, service worker, אייקונים זמניים שנוצרו ב-`scripts/generate-icons.ps1`), באנר "הוסף למסך הבית" ל-iOS Safari. `npm run build` עובר נקי.
Git הותקן במהלך השלב הזה (לא היה על המחשב). GitHub repo: `shahark808-cmd/plant-care-app`. פרויקט Vercel: `pp-e5ee/plant-care-app1`.
**כתובת הפרודקשן: https://plant-care-app1.vercel.app** — תשמש כ-redirect URL כשנגדיר Supabase Auth בשלב 2.

## סיכונים וקומפרומיסים מקובלים

- קוד הזמנה להצטרפות לבית — בלי תפוגה (שלב 2), כי רק שני אנשים אמורים לדעת אותו.
- תמונות מהמצלמה עשויות להיות בפורמט HEIC — מקובל כי האפליקציה מיועדת לשימוש ב-iOS בלבד (Safari מציג HEIC כרגיל).
- Supabase בתוכנית החינמית משהה פרויקט לא פעיל אחרי כשבוע — לא אמור להפריע בפועל כי ה-cron של ההתראות (שלב 5) שומר עליו פעיל.
- אין סוויטת בדיקות אוטומטית — הבדיקה היא ידנית באייפון בסוף כל שלב.

## מוסכמות

- כל הטקסט הפונה למשתמש — בעברית בלבד, RTL.
- שימוש ב-Tailwind logical properties (`ms-`/`me-`/`ps-`/`pe-`) ולא `ml-`/`mr-`, כדי לא לשבור RTL בטעות.
- `src/lib/weather/adjustFrequency.ts` (משלב 6) חייב להישאר פונקציה טהורה, בלי ייבוא של React/Supabase.
- מזהי משאבים (plants, watering_events וכו') הם UUID שנוצרים ב-Postgres (`gen_random_uuid()`).
