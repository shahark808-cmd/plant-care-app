export interface Category {
  id?: number
  name: string
  /** מסגרת חודשית בשקלים; 0 = ללא מסגרת */
  budget: number
  /** קטגוריית ברירת מחדל שמקבלת הוצאות של קטגוריה שנמחקה; לא ניתנת למחיקה */
  isFallback?: boolean
}

export interface Expense {
  id?: number
  amount: number
  categoryId: number
  /** YYYY-MM-DD */
  date: string
  note: string
  /** מזהה הפריט הקבוע שיצר את ההוצאה */
  recurringId?: number
}

export interface Income {
  id?: number
  amount: number
  /** מקור ההכנסה, למשל "משכורת" */
  source: string
  /** YYYY-MM-DD */
  date: string
  /** מזהה הפריט הקבוע שיצר את ההכנסה */
  recurringId?: number
}

export interface Recurring {
  id?: number
  kind: 'expense' | 'income'
  name: string
  amount: number
  /** רלוונטי להוצאה בלבד */
  categoryId?: number
  /** יום בחודש (1-31; בחודש קצר יותר - היום האחרון) */
  day: number
  active: boolean
  /** החודש הראשון ליצירה (YYYY-MM) */
  startMonth: string
  /** תאריך הריצה האחרון; רק תאריכים אחריו נוצרים, כך שמחיקה ידנית לא מתבטלת */
  lastRun?: string
}
