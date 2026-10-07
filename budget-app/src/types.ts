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
}
