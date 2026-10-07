import type { AppSettings, Exercise, ExerciseSettings, SessionEntry, SetLog, WorkoutSession, WorkoutTemplate } from '../types'
import { db, todayStr, uid } from './db'
import { daysBetween, epley1RM, nextSuggestion, roundToStep, type PastSession, type Suggestion } from './progression'

const counts = (s: SetLog) => s.done && (s.kind === 'working' || s.kind === 'failure')

/** Past working-set summaries of one exercise, most recent first. */
export function historyFor(exerciseId: string, finished: WorkoutSession[]): PastSession[] {
  return [...finished]
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))
    .flatMap((s) => {
      const entry = s.entries.find((e) => e.exerciseId === exerciseId)
      const sets = entry?.sets.filter(counts) ?? []
      if (!entry || sets.length === 0) return []
      const weight = sets[0].weight
      return [{ date: s.date, weight, reps: sets.filter((x) => x.weight === weight).map((x) => x.reps), effort: entry.effort }]
    })
}

export function bestE1RM(exerciseId: string, sessions: WorkoutSession[]): number {
  let best = 0
  for (const s of sessions)
    for (const e of s.entries)
      if (e.exerciseId === exerciseId) for (const set of e.sets) if (counts(set)) best = Math.max(best, epley1RM(set.weight, set.reps))
  return best
}

const mkSet = (weight: number, reps: number, kind: SetLog['kind'] = 'working'): SetLog => ({ id: uid(), kind, weight, reps, done: false })

export function suggestFor(
  ex: Exercise,
  cfg: { lo: number; hi: number; step: number; rangeExpanded?: boolean },
  finished: WorkoutSession[],
  settings: AppSettings,
  today = todayStr(),
): Suggestion {
  return nextSuggestion(
    { category: ex.category, lo: cfg.lo, hi: cfg.hi, step: cfg.step, rangeExpanded: cfg.rangeExpanded, history: historyFor(ex.id, finished), today },
    settings.progression,
  )
}

/** A light week runs for 7 days after the user accepts the deload suggestion (starting the next day). */
export function lightWeekActive(settings: AppSettings, today: string): boolean {
  if (!settings.lastDeload) return false
  const d = daysBetween(settings.lastDeload, today)
  return d >= 1 && d <= 7
}

/** Exercises trained in the last 3 weeks whose progress has stalled (uses each exercise's last range). */
export function stalledExerciseIds(finished: WorkoutSession[], byId: Map<string, Exercise>, settings: AppSettings, today: string): string[] {
  const recent = finished.filter((s) => daysBetween(s.date, today) <= 21)
  const ids = [...new Set(recent.flatMap((s) => s.entries.map((e) => e.exerciseId)))]
  return ids.filter((id) => {
    const ex = byId.get(id)
    const last = recent.flatMap((s) => s.entries).find((e) => e.exerciseId === id)
    return ex && last && suggestFor(ex, { lo: last.lo, hi: last.hi, step: last.step }, finished, settings, today).kind === 'stall'
  })
}

export async function startSessionFromTemplate(
  tpl: WorkoutTemplate,
  exercises: Map<string, Exercise>,
  settings: AppSettings,
): Promise<string> {
  const finished = await db.sessions.where('finishedAt').above(0).toArray()
  const overrides = new Map((await db.exerciseSettings.toArray()).map((o) => [o.exerciseId, o] as const))
  const entries: SessionEntry[] = []
  const light = lightWeekActive(settings, todayStr())

  for (const it of tpl.items) {
    const ex = exercises.get(it.exerciseId)
    if (!ex) continue
    const o: ExerciseSettings | undefined = overrides.get(ex.id)
    const cfg = { lo: o?.lo ?? it.lo, hi: o?.hi ?? it.hi, step: o?.step ?? it.step, rangeExpanded: o?.rangeExpanded }
    const sug = suggestFor(ex, cfg, finished, settings)
    if (sug.kind === 'widen' && sug.newHi) {
      await db.exerciseSettings.put({ ...(o ?? { exerciseId: ex.id }), hi: sug.newHi, rangeExpanded: true })
      cfg.hi = sug.newHi
    }
    let weight = sug.kind === 'first' ? it.startWeight : sug.weight
    let setCount = it.sets
    let reason = sug.reason
    if (light && weight > 0) {
      // Light week: lower load and one set less (never below 2), so the week is easier but not empty.
      weight = roundToStep(weight * (1 - settings.progression.deloadPct), cfg.step)
      setCount = Math.max(2, it.sets - 1)
      reason = `שבוע קל: עומס מופחת ב-${Math.round(settings.progression.deloadPct * 100)}% וסט אחד פחות. ${reason}`
    }
    entries.push({
      id: uid(),
      exerciseId: ex.id,
      lo: cfg.lo,
      hi: cfg.hi,
      step: cfg.step,
      restSec: it.restSec,
      note: it.note,
      supersetGroup: it.supersetGroup,
      suggestionReason: reason,
      sets: Array.from({ length: setCount }, () => mkSet(weight, sug.targetLo)),
    })
  }

  const session: WorkoutSession = { id: uid(), date: todayStr(), templateId: tpl.id, name: tpl.name, startedAt: Date.now(), entries }
  await db.sessions.add(session)
  return session.id
}

export async function startEmptySession(): Promise<string> {
  const session: WorkoutSession = { id: uid(), date: todayStr(), name: 'אימון חופשי', startedAt: Date.now(), entries: [] }
  await db.sessions.add(session)
  return session.id
}

export const sessionVolume = (s: WorkoutSession) =>
  s.entries.reduce((a, e) => a + e.sets.filter(counts).reduce((b, x) => b + x.weight * x.reps, 0), 0)

export const weeklySetsByMuscle = (sessions: WorkoutSession[], byId: Map<string, Exercise>, since: string) => {
  const out: Record<string, number> = {}
  for (const s of sessions) {
    if (s.date < since) continue
    for (const e of s.entries) {
      const m = byId.get(e.exerciseId)?.muscle
      if (m) out[m] = (out[m] ?? 0) + e.sets.filter(counts).length
    }
  }
  return out
}
