import type { Run } from '../types'
import { volumeSpike } from './running'

export interface InsightContext {
  today: string
  runs: Run[]
  /** Days with logged food, most recent first, excluding today. */
  proteinDays: { date: string; protein: number }[]
  proteinTarget?: number
  stalledExercises: number
  deloadSuggested: boolean
  /** Exercises rated "easy" in the last 14 days. */
  easyRatings: number
  /** A hard run sits within 24h of a heavy legs session. */
  runLegsConflict: boolean
}

/** Patterns detected in the user's own data. Order = priority. */
export function detectTriggers(c: InsightContext): string[] {
  const out: string[] = []
  if (volumeSpike(c.runs, c.today)) out.push('run-volume-spike')
  if (c.runLegsConflict) out.push('concurrent-training')
  if (c.proteinTarget) {
    const last3 = c.proteinDays.slice(0, 3)
    if (last3.length === 3 && last3.every((d) => d.protein < c.proteinTarget! * 0.8)) out.push('protein-intake')
  }
  if (c.stalledExercises >= 1 || c.deloadSuggested) out.push('deload-consensus')
  if (c.easyRatings >= 3) out.push('proximity-failure')
  return out
}

/** Weekly streak with one forgiven miss, so a single bad week does not erase progress. */
export function weeklyStreak(completedWeeks: number[], currentWeek: number, goal: number): number {
  let streak = currentWeek >= goal ? 1 : 0
  let graceUsed = false
  for (let i = completedWeeks.length - 1; i >= 0; i--) {
    if (completedWeeks[i] >= goal) streak++
    else if (!graceUsed) graceUsed = true
    else break
  }
  return streak
}
