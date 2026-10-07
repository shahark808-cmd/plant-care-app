import type { Food, Goal, Macros, Profile, Targets } from '../types'

export const GOAL_DELTA: Record<Goal, number> = { gain: 250, maintain: 0, lose: -400 }

export function bmr(p: Pick<Profile, 'weightKg' | 'heightCm' | 'age' | 'sex'>): number {
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161)
}

export function activityFactor(workoutsPerWeek: number): number {
  if (workoutsPerWeek <= 0) return 1.2
  if (workoutsPerWeek <= 3) return 1.375
  if (workoutsPerWeek <= 5) return 1.55
  return 1.725
}

export function calcTargets(p: Profile, today: string): Targets {
  const maintenance = bmr(p) * activityFactor(p.workoutsPerWeek)
  const calories = Math.round(maintenance + GOAL_DELTA[p.goal])
  const protein = Math.round(p.weightKg * 1.8)
  const fat = Math.round(p.weightKg * 0.9 * 10) / 10
  const carbs = Math.max(0, Math.round(((calories - protein * 4 - fat * 9) / 4) * 10) / 10)
  return { calories, protein, carbs, fat, source: 'calculated', updatedAt: today }
}

export const sumMacros = (items: Macros[]): Macros =>
  items.reduce((a, i) => ({ kcal: a.kcal + i.kcal, protein: a.protein + i.protein, carbs: a.carbs + i.carbs, fat: a.fat + i.fat }), { kcal: 0, protein: 0, carbs: 0, fat: 0 })

const r1 = (n: number) => Math.round(n * 10) / 10

export function macrosForGrams(food: Food, grams: number): Macros {
  const k = grams / 100
  return { kcal: Math.round(food.per100.kcal * k), protein: r1(food.per100.protein * k), carbs: r1(food.per100.carbs * k), fat: r1(food.per100.fat * k) }
}

/** Exponential moving average to smooth daily body-weight noise. Input must be date-ascending. */
export function ema(values: number[], alpha = 0.2): number[] {
  const out: number[] = []
  values.forEach((v, i) => out.push(i === 0 ? v : alpha * v + (1 - alpha) * out[i - 1]))
  return out.map((v) => Math.round(v * 100) / 100)
}

export interface CalorieAdvice { kcalDelta: number; reason: string }

/**
 * Section 8.2: when gaining and the trend has been flat for 2-3 weeks, suggest adding calories.
 * `trend` is date-ascending {date, kg} of the smoothed weight.
 */
export function calorieAdvice(goal: Goal, trend: { date: string; kg: number }[]): CalorieAdvice | null {
  if (goal !== 'gain' || trend.length < 2) return null
  const last = trend[trend.length - 1]
  const day = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 86_400_000
  const window = trend.filter((t) => day(last.date) - day(t.date) <= 21)
  const first = window[0]
  const days = day(last.date) - day(first.date)
  if (days < 14) return null
  const perWeek = ((last.kg - first.kg) / days) * 7
  if (perWeek >= 0.1) return null
  return { kcalDelta: 150, reason: `מגמת המשקל כמעט לא זזה ב-${Math.round(days / 7)} השבועות האחרונים. אפשר להוסיף כ-150 קלוריות ליום` }
}
