/** חודש פיננסי: מ-startDay בחודש ועד היום שלפני startDay בחודש הבא. */

export interface Period {
  start: string; // YYYY-MM-DD, כולל
  end: string; // YYYY-MM-DD, כולל
}

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** יום התחלה מוגבל לאורך החודש (למשל 31 בפברואר -> 28). */
function clampedStart(year: number, month: number, startDay: number): number {
  return Math.min(startDay, daysInMonth(year, month));
}

export function toIsoDate(date: Date): string {
  return iso(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function parseIso(value: string): [number, number, number] {
  const [y, m, d] = value.split("-").map(Number);
  return [y ?? 0, m ?? 0, d ?? 0];
}

/** התקופה שאליה שייך התאריך. */
export function periodFor(date: string, startDay = 10): Period {
  const [y, m, d] = parseIso(date);
  let startYear = y;
  let startMonth = m;
  if (d < clampedStart(y, m, startDay)) {
    startMonth -= 1;
    if (startMonth === 0) {
      startMonth = 12;
      startYear -= 1;
    }
  }
  let nextYear = startYear;
  let nextMonth = startMonth + 1;
  if (nextMonth === 13) {
    nextMonth = 1;
    nextYear += 1;
  }
  const startD = clampedStart(startYear, startMonth, startDay);
  const nextStart = new Date(Date.UTC(nextYear, nextMonth - 1, clampedStart(nextYear, nextMonth, startDay)));
  nextStart.setUTCDate(nextStart.getUTCDate() - 1);
  return {
    start: iso(startYear, startMonth, startD),
    end: iso(nextStart.getUTCFullYear(), nextStart.getUTCMonth() + 1, nextStart.getUTCDate()),
  };
}

function utcDay(value: string): number {
  const [y, m, d] = parseIso(value);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/** ימים שנותרו בתקופה, כולל היום (לפחות 1). */
export function daysLeftInPeriod(today: string, startDay = 10): number {
  const { end } = periodFor(today, startDay);
  return Math.max(1, utcDay(end) - utcDay(today) + 1);
}

export function inPeriod(date: string, period: Period): boolean {
  return date >= period.start && date <= period.end;
}
