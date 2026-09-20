# העוזר האישי של שחר — Korea Trip PWA

אפליקציית ווב (PWA) אישית — עוזר טיול לקוריאה. תוכנית יומית, מדריך רבעים בסיאול, המלצות מקומות, ניווט (Naver/Kakao, לא Google) ותרגום עברית-קוריאנית. בלי בק-אנד בשלב זה — כל התוכן סטטי בקוד, ועריכות המשתמש (הערות ביומן, שם פרטי) נשמרות ב-`localStorage`. מותקנת למסך הבית (Add to Home Screen), לא אפליקציה נייטיב.

> **הערה:** הריפו הזה שימש בעבר לפרויקט "טיפוח הצמחים" (Plant Care PWA). לפי בקשת המשתמש הוא הוחלף לגמרי בפרויקט הזה — היסטוריית ה-git הישנה עדיין קיימת אם צריך לחזור אליה.

## החלטות ארכיטקטורה

- **Vite + React + TypeScript, לא Next.js** — SPA טהורה, static hosting (Vercel). אין צורך ב-SSR.
- **Tailwind CSS v4** (`@tailwindcss/vite`) — אין `tailwind.config.js`; טוקני העיצוב (צבעים, פונטים) מוגדרים ב-`@theme` בתוך `src/index.css` ומולידים אוטומטית utility classes (למשל `--color-accent` → `bg-accent`/`text-accent`). RTL מלא: `dir="rtl" lang="he"` על ה-`<html>`, ואין שימוש ב-`ml-`/`mr-`/`pl-`/`pr-` (רק לוגיות: `ms-`/`me-`/`ps-`/`pe-` או `gap`).
- **react-router-dom (`BrowserRouter`)** לניווט אמיתי בין מסכים, לא קבצי HTML נפרדים.
- **בלי backend** — כל התוכן (רבעים, מקומות, יומן ברירת מחדל, ביטויים) הוא נתונים סטטיים ב-`src/data/`. מצב שהמשתמש עורך (שם, הערות יומן) נשמר ב-`localStorage` בלבד (`src/lib/storage.ts`). אם בעתיד יידרש סנכרון בין מכשירים, יתווסף בק-אנד (למשל Supabase) — כרגע לא נחוץ לשימוש של משתמש יחיד.
- **תרגום: MyMemory Translation API** (`api.mymemory.translated.net`) — חינמי, בלי מפתח API, נקרא ישירות מהדפדפן (`src/lib/translate.ts`). יש לו מגבלת קצב יומית נדיבה למשתמש אנונימי; אם זה יהפוך לבעיה אפשר לעבור ל-Papago/Google Translate (דורש מפתח + Edge Function כדי לא לחשוף אותו בקליינט).
- **ניווט: Naver Map / Kakao Map, לא Google Maps** — Google Maps מוגבל מאוד בניווט turn-by-turn בקוריאה. הקישורים (`src/lib/mapLinks.ts`) הם קישורי web (`map.naver.com` / `map.kakao.com`) שפותחים את חיפוש המקום; אין אינטגרציית SDK.
- **בלי סוויטת בדיקות אוטומטית** — פרויקט אישי; כל שינוי נבדק ידנית (`npm run dev` + דפדפן/אייפון).

## מבנה תיקיות

```
public/icons/          # אייקוני PWA (192, 512, maskable, apple-touch-icon) — נוצרים ע"י scripts/generate-icons.mjs
scripts/generate-icons.mjs  # מחולל אייקונים טהור-JS (PNG encoder ידני, בלי תלויות), בלי צורך ברשת
src/routes/             # מסך לכל route: Welcome, Seoul, Today, Info, Places, Navigate, Translate
src/components/layout/  # AppShell (עטיפת המסכים 3-7 + BottomNav), BottomNav
src/components/common/  # Chip, CategoryTag, Accordion, TaegeukIcon, SeoulSkylineSvg
src/data/                # תוכן סטטי: districts, places, itinerary, info, phrases (מקור האמת לתוכן מהבריף)
src/lib/                 # storage (localStorage), translate (MyMemory API), mapLinks (Naver/Kakao), pwa/registerSW
src/types.ts             # טיפוסי דומיין (CategoryKey, Place, DistrictInfo וכו')
```

## פקודות

```bash
npm run dev             # שרת פיתוח מקומי
npm run build            # בדיקת טיפוסים (tsc -b) + build לפרודקשן
npm run preview          # תצוגה מקדימה של ה-build
npm run lint              # oxlint
npm run generate-icons    # מייצר מחדש את אייקוני ה-PWA ב-public/icons
```

## משתני סביבה

**אין משתני סביבה כרגע** — אין backend, ואין מפתחות API (תרגום דרך MyMemory וניווט דרך קישורי web, שניהם בלי מפתח). כלל קבוע לעתיד: שום מפתח או סוד לא נכנס לקוד או ל-git.

## מפת מסכים וזרימה

1. **ברוכים הבאים** (`/welcome`) → 2. **סיאול** (`/seoul`, hero+רבעים) → 3. **היום** (`/today`) ↔ 4. **מידע חשוב** (`/info`) ↔ 5. **המלצות** (`/places`) ↔ 6. **ניווט** (`/navigate`) ↔ 7. **תרגום** (`/translate`)

`BottomNav` מופיע בכל המסכים חוץ מ-Welcome ו-Seoul (4 טאבים: היום/המלצות/ניווט/תרגום). "מידע חשוב" נגיש דרך כרטיס במסך הבית, לא טאב בניווט התחתון. `/` מפנה ל-`/today` אם יש שם משתמש שמור ב-localStorage, אחרת ל-`/welcome`.

## מודל תוכן

כל התוכן (7 רבעים, 33 מקומות, 4 פריטי יומן ברירת מחדל, 3 קטגוריות מידע, 6 ביטויים, 3 מקומות שמורים) מועתק ישירות מבריף העיצוב שהמשתמש סיפק, ב-`src/data/`. שיוך הצ'יפים לרבעים (למשל 14 חנויות האופנה של סאונגסו-דונג) בוצע לפי הבריף. פריטי היומן כוללים placeholder להערה אישית (`notePlaceholder`) שניתן ללחוץ עליו ולערוך inline — נשמר ב-localStorage לפי `itemId`.

## סיכונים וקומפרומיסים מקובלים

- MyMemory API הוא שירות חינמי צד-שלישי בלי הסכם SLA — אם הוא ייפול או יחסום, התרגום החופשי (לא הביטויים המהירים, שהם סטטיים) יפסיק לעבוד עד שיוחלף.
- אייקוני ה-PWA (טאעגוק מופשט על רקע ירוק) נוצרים אלגוריתמית ב-`scripts/generate-icons.mjs` ואינם שכפול מדויק של דגל דרום קוריאה — קישוט בלבד, לא סמל רשמי.
- אין persistence חוצה-מכשירים — אם המשתמש מתקין את ה-PWA בשני מכשירים, ההערות שנשמרות ב-localStorage לא יסתנכרנו ביניהם.
- אין סוויטת בדיקות אוטומטית — בדיקה ידנית בדפדפן/באייפון.

## מוסכמות

- כל הטקסט הפונה למשתמש — בעברית, RTL. שמות מקומות/מונחים באנגלית/קוריאנית משולבים בטקסט לפי הצורך (בהתאם לבריף).
- Tailwind logical properties (`ms-`/`me-`/`ps-`/`pe-`, `gap`) ולא `ml-`/`mr-`/`pl-`/`pr-`.
- הודעות שגיאה בקוד (כמו כשלון תרגום) תמיד מנוסחות מחדש לעברית ידידותית — אף פעם לא מוצגות הודעות שגיאה גולמיות באנגלית מה-API/מהדפדפן למשתמש.
- טוקני צבע/פונט מוגדרים במקום אחד — `src/index.css` (`@theme`). קטגוריות מקומות (אוכל/קפה/קניות/אטרקציה/נוף) ממופות ל-`CategoryTag`.
