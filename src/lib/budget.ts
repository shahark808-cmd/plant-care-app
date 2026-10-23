/** לוגיקת תקציב טהורה (כל הסכומים באגורות, כל התאריכים YYYY-MM-DD). */

import type { Transaction } from "@/lib/types";

const pad = (n: number) => String(n).padStart(2, "0");

function parse(date: string): [number, number, number] {
  const [y, m, d] = date.split("-").map(Number);
  return [y ?? 0, m ?? 0, d ?? 0];
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function build(year: number, month: number, day: number) {
  const dim = daysInMonth(year, month);
  return `${year}-${pad(month)}-${pad(Math.min(day, dim))}`;
}

/** מוסיף חודשים ושומר על היום בחודש (מקוצר לחודשים קצרים). */
export function addMonths(date: string, months: number): string {
  const [y, m, d] = parse(date);
  const total = y * 12 + (m - 1) + months;
  return build(Math.floor(total / 12), (total % 12) + 1, d);
}

function firstOfNextMonth(date: string) {
  const [y, m] = parse(date);
  const [ny, nm] = parse(addMonths(build(y, m, 1), 1));
  return [ny, nm] as const;
}

/** יום החיוב הקרוב אחרי הקנייה (ברירת מחדל: ה-2). חיוב ביום הקנייה עצמו עובר לחודש הבא. */
export function nextChargeDate(purchase: string, chargeDay = 2): string {
  const [y, m] = parse(purchase);
  const thisMonth = build(y, m, chargeDay);
  if (thisMonth > purchase) return thisMonth;
  const [ny, nm] = firstOfNextMonth(purchase);
  return build(ny, nm, chargeDay);
}

export interface InstallmentRow {
  index: number;
  amount: number;
  date: string;
  chargeDate: string | null;
}

/** פריסת קנייה לתשלומים: הראשון נושא את שארית האגורות; כל תשלום שייך לחודש שלו. */
export function installmentPlan(total: number, count: number, purchase: string, chargeDay: number | null): InstallmentRow[] {
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from({ length: count }, (_, i) => {
    const date = addMonths(purchase, i);
    return {
      index: i + 1,
      amount: base + (i === 0 ? remainder : 0),
      date,
      chargeDate: chargeDay === null ? null : nextChargeDate(date, chargeDay),
    };
  });
}

export type Bucket = "needs" | "wants" | "savings";
export const BUCKET_LABEL: Record<Bucket, string> = { needs: "צרכים", wants: "רצונות", savings: "חיסכון" };
const SHARE: Record<Bucket, number> = { needs: 50, wants: 30, savings: 20 };

/** תבנית 50/30/20: מחלק כל קבוצה שווה בשווה בין הקטגוריות שלה (שארית לראשונה). */
export function split503020(income: number, categories: { id: string; bucket: Bucket | null }[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const bucket of ["needs", "wants", "savings"] as const) {
    const ids = categories.filter((c) => c.bucket === bucket).map((c) => c.id);
    if (ids.length === 0) continue;
    const pot = Math.round((income * SHARE[bucket]) / 100);
    const each = Math.floor(pot / ids.length);
    ids.forEach((id, i) => {
      result[id] = each + (i === 0 ? pot - each * ids.length : 0);
    });
  }
  return result;
}

/** התקציב התקף לתקופה: השורה האחרונה לכל קטגוריה שתחילתה לא אחרי תחילת התקופה. */
export function effectiveBudgets(rows: { category_id: string | null; period_start: string; amount: number }[], periodStart: string) {
  const best = new Map<string, { period_start: string; amount: number }>();
  for (const r of rows) {
    if (!r.category_id || r.period_start > periodStart) continue;
    const cur = best.get(r.category_id);
    if (!cur || r.period_start > cur.period_start) best.set(r.category_id, r);
  }
  return new Map([...best].map(([id, r]) => [id, r.amount]));
}

export interface Allowance {
  remaining: number;
  perDay: number;
}

/** "כמה אפשר להוציא היום": תקציב משתנה שנותר חלקי ימים שנותרו (לא שלילי). */
export function dailyAllowance(totalBudget: number, totalSpent: number, daysLeft: number): Allowance {
  const remaining = totalBudget - totalSpent;
  return { remaining, perDay: Math.max(0, Math.floor(remaining / Math.max(1, daysLeft))) };
}

export type ViewMode = "purchase" | "charge";

/** התאריך שבו התנועה נספרת בתצוגה: קנייה = date, חיוב = charge_date (או date כשאין). */
export function effectiveDate(tx: Pick<Transaction, "date" | "charge_date">, mode: ViewMode) {
  return mode === "charge" ? (tx.charge_date ?? tx.date) : tx.date;
}

/** "החיוב הקרוב": סכום ההוצאות שיורדות בתאריך החיוב הקרוב ביותר (מהיום ואילך). */
export function upcomingCharge(txs: Pick<Transaction, "amount" | "type" | "charge_date">[], today: string) {
  const dates = txs.filter((t) => t.type === "expense" && t.charge_date && t.charge_date >= today).map((t) => t.charge_date!);
  if (dates.length === 0) return null;
  const date = dates.reduce((a, b) => (a < b ? a : b));
  const amount = txs.filter((t) => t.type === "expense" && t.charge_date === date).reduce((s, t) => s + t.amount, 0);
  return { date, amount };
}

/** המועד הבא של הוצאה קבועה שיורדת ב-dayOfMonth (היום עצמו נחשב). */
export function nextOccurrence(dayOfMonth: number, today: string): string {
  const [y, m] = parse(today);
  const thisMonth = build(y, m, dayOfMonth);
  if (thisMonth >= today) return thisMonth;
  const [ny, nm] = firstOfNextMonth(today);
  return build(ny, nm, dayOfMonth);
}

export function daysBetween(from: string, to: string) {
  const ms = (d: string) => {
    const [y, m, day] = parse(d);
    return Date.UTC(y, m - 1, day) / 86_400_000;
  };
  return ms(to) - ms(from);
}
