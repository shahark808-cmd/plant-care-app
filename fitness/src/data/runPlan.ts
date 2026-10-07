// Section 7.2: 12-week plan up to 10 km. Editable starting point, not a prescription.
export interface PlanWeek {
  week: number
  title: string
  /** Two short easy runs (minutes) and one long run (Saturday). */
  easy: string
  long: string
  /** Rough long-run distance used to compare plan vs actual. */
  longKm: number
  note?: string
}

export const PLAN_WEEKDAYS = { easy: [0, 3], long: 6 } as const // Sunday, Wednesday, Saturday

export const RUN_PLAN: PlanWeek[] = [
  { week: 1, title: 'ריצה והליכה לסירוגין', easy: 'דקה ריצה ודקה הליכה, כ-25 דקות', long: 'דקה ריצה ודקה הליכה, כ-30 דקות', longKm: 3 },
  { week: 2, title: 'ריצה והליכה לסירוגין', easy: 'דקה ריצה ודקה הליכה, כ-25 דקות', long: 'דקה ריצה ודקה הליכה, כ-30 דקות', longKm: 3.5 },
  { week: 3, title: 'שלוש דקות ריצה', easy: '3 דקות ריצה ודקה הליכה, כ-30 דקות', long: '3 דקות ריצה ודקה הליכה, כ-35 דקות', longKm: 4 },
  { week: 4, title: 'שלוש דקות ריצה', easy: '3 דקות ריצה ודקה הליכה, כ-30 דקות', long: '3 דקות ריצה ודקה הליכה, כ-35 דקות', longKm: 4.5 },
  { week: 5, title: 'חמישה ק״מ ברצף', easy: 'ריצה קלה 20 עד 25 דקות', long: '5 ק״מ ברצף בקצב איטי', longKm: 5 },
  { week: 6, title: 'חמישה ק״מ ברצף', easy: 'ריצה קלה 20 עד 25 דקות', long: '5 ק״מ ברצף בקצב איטי', longKm: 5, note: 'אפשר לחזור על השבוע אם הוא עדיין מרגיש קשה' },
  { week: 7, title: 'שישה ק״מ', easy: 'ריצה קלה 25 דקות', long: '6 ק״מ בקצב נוח', longKm: 6 },
  { week: 8, title: 'שבעה ק״מ', easy: 'ריצה קלה 25 עד 30 דקות', long: '7 ק״מ בקצב נוח', longKm: 7 },
  { week: 9, title: 'שמונה ק״מ', easy: 'ריצה קלה 30 דקות', long: '8 ק״מ בקצב נוח', longKm: 8 },
  { week: 10, title: 'תשעה ק״מ', easy: 'ריצה קלה 30 דקות', long: '9 ק״מ בקצב נוח', longKm: 9 },
  { week: 11, title: 'עשרה ק״מ', easy: 'ריצה קלה 30 דקות', long: '10 ק״מ בקצב נוח', longKm: 10 },
  { week: 12, title: 'שבוע קל וריצת מבחן', easy: 'ריצה קלה 20 דקות', long: 'ריצת מבחן של 10 ק״מ', longKm: 10, note: 'מוותרים על הריצה הקלה השנייה אם הרגליים כבדות' },
]
