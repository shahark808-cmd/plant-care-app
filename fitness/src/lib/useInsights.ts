import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { INSIGHTS, type Insight, type InsightArea } from '../data/insights'
import { db, todayStr } from './db'
import { useExercises, useFinishedSessions, useSettings } from './hooks'
import { detectTriggers } from './insights'
import { daysBetween, deloadSignal } from './progression'
import { legsConflicts } from './running'
import { stalledExerciseIds } from './session'
import type { MealLog, Run } from '../types'
import { useLegSessionTimes } from '../routes/RunningRoute'

/** Insights whose trigger fired on the user's own data and that were not hidden, most relevant first. */
export function useInsights(area?: InsightArea): Insight[] {
  const settings = useSettings()
  const { byId } = useExercises()
  const finished = useFinishedSessions()
  const legs = useLegSessionTimes()
  const runs = useLiveQuery(() => db.runs.toArray(), [], [] as Run[])
  const meals = useLiveQuery(() => db.meals.toArray(), [], [] as MealLog[])
  const hidden = useLiveQuery(() => db.hiddenInsights.toArray(), [], [])

  return useMemo(() => {
    const today = todayStr()
    const byDay = new Map<string, number>()
    for (const m of meals) if (m.date < today) byDay.set(m.date, (byDay.get(m.date) ?? 0) + m.items.reduce((a, i) => a + i.protein, 0))
    const proteinDays = [...byDay].sort((a, b) => b[0].localeCompare(a[0])).map(([date, protein]) => ({ date, protein }))
    const stalled = stalledExerciseIds(finished, byId, settings, today).length
    const easy = finished.filter((s) => daysBetween(s.date, today) <= 14).flatMap((s) => s.entries).filter((e) => e.effort === 'easy').length
    const veryHard = finished.filter((s) => daysBetween(s.date, today) <= 14).flatMap((s) => s.entries).filter((e) => e.effort === 'very_hard').length
    const since = settings.lastDeload ?? finished[finished.length - 1]?.date
    const deload = since ? deloadSignal(Math.floor(daysBetween(since, today) / 7), stalled, veryHard).suggest : false
    const conflict = runs.some((r) => r.quality && daysBetween(r.date, today) <= 14 && legsConflicts(Date.parse(r.date + 'T12:00'), legs).length > 0)
    const ids = detectTriggers({ today, runs, proteinDays, proteinTarget: settings.targets?.protein, stalledExercises: stalled, deloadSuggested: deload, easyRatings: easy, runLegsConflict: conflict })
    const hide = new Set(hidden.map((h) => h.id))
    return ids.filter((id) => !hide.has(id)).map((id) => INSIGHTS.find((i) => i.id === id)!).filter((i) => !area || i.area === area)
  }, [settings, byId, finished, legs, runs, meals, hidden, area])
}
