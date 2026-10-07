# התקציב שלי

אפליקציית תקציב אישית בעברית (RTL), PWA למובייל. Vite + React + TypeScript + Tailwind v4 + Dexie (IndexedDB). הנתונים נשמרים מקומית בדפדפן, בלי שרת.

## מצב נוכחי: שלב 1
הוספת הוצאה מהירה, קטגוריות (הוספה/עריכה/מחיקה), מסגרת חודשית עם פס התקדמות (ירוק/כתום/אדום), רשימת הוצאות לפי חודש עם עריכה, מחיקה וסינון. מצב כהה/בהיר.

## הרצה
```bash
cd budget-app
npm install
npm run dev      # פיתוח
npm run build    # בדיקת טיפוסים + build
npm run preview  # תצוגה מקדימה של ה-build
```

## פריסה ל-Vercel
ב-Vercel: Import של הריפו, **Root Directory = `budget-app`**, Framework = Vite. `vercel.json` מטפל ב-rewrite ל-SPA.

## התקנה בטלפון
פותחים את הכתובת בדפדפן ← "הוסף למסך הבית".
