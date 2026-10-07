const money = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 2,
})
export const formatMoney = (n: number) => money.format(n)

export const todayStr = () => toDateStr(new Date())

export function toDateStr(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** YYYY-MM-DD -> dd/MM/yyyy */
export function formatDate(s: string) {
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

export const monthKey = (d = new Date()) => toDateStr(d).slice(0, 7)

export function shiftMonth(key: string, delta: number) {
  const [y, m] = key.split('-').map(Number)
  return toDateStr(new Date(y, m - 1 + delta, 1)).slice(0, 7)
}

export function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1))
}

/** טווח תאריכים [start, end] כמחרוזות להשוואה לקסיקוגרפית */
export const monthRange = (key: string): [string, string] => [`${key}-01`, `${key}-31`]

/** ירוק עד 70%, כתום עד 100%, אדום מעבר */
export function usageColor(pct: number) {
  if (pct >= 100) return 'bg-bad'
  if (pct >= 70) return 'bg-warn'
  return 'bg-ok'
}
