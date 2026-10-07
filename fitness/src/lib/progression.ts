import type { Category, Effort, ProgressionSettings } from '../types'

export const DEFAULT_PROGRESSION: ProgressionSettings = {
  pctLower: 0.05,
  pctCompoundUpper: 0.025,
  pctIsolation: 0.025,
  sessionsAtTopBeforeRaise: 1,
  stallSessionsBeforeSuggestion: 3,
  deloadPct: 0.1,
  layoffDays: 14,
  layoffRestartPct: 0.925, // middle of the 0.90-0.95 range
  bigJumpThreshold: 0.1,
  bodyweightAddKg: 2.5,
}

/** Working sets of one past session of an exercise (warm-ups excluded). */
export interface PastSession {
  date: string // YYYY-MM-DD
  weight: number
  reps: number[]
  effort?: Effort
}

export interface ProgressionInput {
  category: Category
  lo: number
  hi: number
  step: number
  rangeExpanded?: boolean
  /** Most recent first. */
  history: PastSession[]
  today: string
}

export type SuggestionKind =
  | 'first'
  | 'raise'
  | 'hold'
  | 'widen'
  | 'add-load'
  | 'layoff'
  | 'reduce'
  | 'stall'

export interface Suggestion {
  kind: SuggestionKind
  weight: number
  targetLo: number
  targetHi: number
  /** New upper bound when the range was widened. */
  newHi?: number
  rangeExpanded?: boolean
  reason: string
  /** Offered when progress has stalled. */
  options?: ('deload' | 'add-set' | 'swap')[]
  deloadWeight?: number
}

export function roundToStep(value: number, step: number): number {
  if (step <= 0) return value
  return Math.round(Math.round(value / step) * step * 1000) / 1000
}

const clean = (n: number) => Math.round(n * 1000) / 1000

export function daysBetween(a: string, b: string): number {
  const d = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10))
  return Math.round((d(b) - d(a)) / 86_400_000)
}

const pctFor = (cat: Category, s: ProgressionSettings) =>
  cat === 'lower' ? s.pctLower : cat === 'compound-upper' ? s.pctCompoundUpper : s.pctIsolation

const isTop = (s: PastSession, hi: number) => s.reps.length > 0 && s.reps.every((r) => r >= hi)
const total = (s: PastSession) => s.reps.reduce((a, b) => a + b, 0)

export function nextSuggestion(
  input: ProgressionInput,
  settings: ProgressionSettings = DEFAULT_PROGRESSION,
): Suggestion {
  const { category, lo, step, history, today } = input
  let { hi } = input
  const last = history[0]

  if (!last) {
    return { kind: 'first', weight: 0, targetLo: lo, targetHi: hi, reason: 'אימון ראשון בתרגיל. התחל במשקל נוח ונכוון משם' }
  }

  // Long break: restart a little lighter.
  if (daysBetween(last.date, today) > settings.layoffDays) {
    const w = roundToStep(last.weight * settings.layoffRestartPct, step)
    return {
      kind: 'layoff',
      weight: w,
      targetLo: lo,
      targetHi: hi,
      reason: `עברו ${daysBetween(last.date, today)} ימים מאז האימון האחרון, מתחילים קצת יותר קל ועולים בהדרגה`,
    }
  }

  // Two sessions in a row where the first set is under the range: step down.
  const prev = history[1]
  if (prev && last.reps[0] < lo && prev.reps[0] < lo && prev.weight === last.weight) {
    const w = Math.min(roundToStep(last.weight * 0.95, step), last.weight - step)
    return {
      kind: 'reduce',
      weight: Math.max(w, 0),
      targetLo: lo,
      targetHi: hi,
      reason: 'הסט הראשון נשאר מתחת לטווח בשני אימונים ברצף, מורידים קצת כדי לחזור לטווח',
    }
  }

  // Stall: N sessions at the same weight with no extra reps.
  const n = settings.stallSessionsBeforeSuggestion
  if (history.length >= n) {
    const recent = history.slice(0, n)
    const oldest = recent[n - 1]
    const stalled = recent.every((s) => s.weight === oldest.weight && total(s) <= total(oldest))
    if (stalled && !isTop(last, hi)) {
      return {
        kind: 'stall',
        weight: last.weight,
        targetLo: lo,
        targetHi: hi,
        reason: `${n} אימונים בלי התקדמות. אפשר להוריד עומס לשבוע קל, להוסיף סט או להחליף תרגיל`,
        options: ['deload', 'add-set', 'swap'],
        deloadWeight: roundToStep(last.weight * (1 - settings.deloadPct), step),
      }
    }
  }

  // Was the top of the range reached on N consecutive sessions at this weight?
  const need = Math.max(1, settings.sessionsAtTopBeforeRaise)
  const atTop =
    history.length >= need &&
    history.slice(0, need).every((s) => isTop(s, hi) && s.weight === last.weight)

  if (!atTop) {
    if (last.effort === 'very_hard') {
      return {
        kind: 'hold',
        weight: last.weight,
        targetLo: lo,
        targetHi: hi,
        reason: 'האימון הקודם היה כבד מאוד, נשארים באותו משקל ומנסים להוסיף חזרה',
      }
    }
    const target = Math.min(Math.min(...last.reps) + 1, hi)
    return {
      kind: 'hold',
      weight: last.weight,
      targetLo: Math.min(target, hi),
      targetHi: hi,
      reason: `עוד לא הגעת ל-${hi} חזרות בכל הסטים. נשארים במשקל ומוסיפים חזרה`,
    }
  }

  // Body-weight movements: add external load instead of raising weight.
  if (category === 'bodyweight') {
    const add = settings.bodyweightAddKg
    return {
      kind: 'add-load',
      weight: clean(last.weight + add),
      targetLo: lo,
      targetHi: lo + 1,
      reason: `הגעת ל-${hi} חזרות בכל הסטים. מוסיפים ${add} ק״ג ומתחילים שוב מ-${lo}`,
    }
  }

  // Isolation moves often only have coarse steps (a 1 kg dumbbell jump is the
  // smallest available), so widening the range would never help there.
  if (category !== 'isolation' && last.weight > 0 && step / last.weight > settings.bigJumpThreshold && !input.rangeExpanded) {
    const newHi = hi + 2
    return {
      kind: 'widen',
      weight: last.weight,
      targetLo: lo,
      targetHi: newHi,
      newHi,
      rangeExpanded: true,
      reason: `הצעד הקטן ביותר (${step} ק״ג) הוא קפיצה גדולה ביחס ל-${last.weight} ק״ג, לכן מרחיבים את הטווח ל-${lo}–${newHi} ונשארים במשקל`,
    }
  }

  let jump = Math.max(step, last.weight * pctFor(category, settings))
  let boosted = false
  if (last.effort === 'easy') {
    jump = Math.min(jump * 2, jump + step)
    boosted = true
  }
  // Round the jump (not the result) to the step, so off-grid weights such as
  // 42 kg on a 2.5 kg step still move by whole steps. Always at least +1 step.
  const weight = clean(last.weight + Math.max(step, roundToStep(jump, step)))
  const diff = clean(weight - last.weight)
  return {
    kind: 'raise',
    weight: clean(weight),
    targetLo: lo,
    targetHi: Math.min(lo + 1, hi),
    reason: `השלמת ${last.reps.join('/')}, עולים ${diff} ק״ג${boosted ? ' (האימון הקודם הרגיש קל)' : ''}`,
  }
}

/** Epley estimated 1RM, for display only. */
export function epley1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0
  return reps === 1 ? weight : weight * (1 + reps / 30)
}

export type DeloadSignal = { suggest: boolean; reason?: string }

/** Suggest a light week after enough weeks of training or when several exercises stall. */
export function deloadSignal(weeksSinceLight: number, stalledExercises: number, veryHardCount: number): DeloadSignal {
  if (weeksSinceLight >= 8) return { suggest: true, reason: `עברו ${weeksSinceLight} שבועות בלי שבוע קל` }
  if (weeksSinceLight >= 5 && stalledExercises >= 2)
    return { suggest: true, reason: 'כמה תרגילים נתקעו ועברו כבר כמה שבועות מאז שבוע קל' }
  if (veryHardCount >= 3) return { suggest: true, reason: 'דירוגי המאמץ הכבדים מצטברים' }
  return { suggest: false }
}
