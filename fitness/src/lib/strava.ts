import { db } from './db'
import { stravaClientId, supabase } from './supabase'
import type { Run } from '../types'

const ERRORS: Record<string, string> = {
  unauthorized: 'צריך להתחבר לחשבון לפני החיבור ל-Strava.',
  missing_scope: 'לא אושרה גישה לפעילויות. אשר את ההרשאה לצפייה בפעילויות ב-Strava.',
  rate_limited: 'Strava מגבילה כרגע את מספר הבקשות. נסה שוב בעוד כמה דקות.',
  strava_rejected: 'Strava דחתה את הבקשה. נסה להתחבר מחדש.',
  not_connected: 'החשבון עוד לא מחובר ל-Strava.',
}
export const friendly = (code?: string) => (code && ERRORS[code]) || 'משהו השתבש בחיבור ל-Strava. נסה שוב בעוד רגע.'

async function call(route: string, body: object = {}): Promise<{ ok?: boolean; synced?: number; connected?: boolean; error?: string }> {
  if (!supabase) return { error: 'no_backend' }
  const { data, error } = await supabase.functions.invoke(`strava/${route}`, { body })
  if (error) {
    // functions-js puts the response in error.context for non-2xx replies
    const ctx = (error as { context?: Response }).context
    const parsed = ctx ? await ctx.json().catch(() => null) : null
    return { error: parsed?.error ?? 'error' }
  }
  return data
}

export const authorizeUrl = () =>
  `https://www.strava.com/oauth/authorize?client_id=${stravaClientId}&response_type=code&approval_prompt=auto&scope=activity:read_all&redirect_uri=${encodeURIComponent(location.origin + '/settings')}`

export const exchangeCode = (code: string, scope: string) => call('auth', { code, scope })
export const stravaStatus = () => call('status')
export const requestSync = (days = 30) => call('sync', { days })
export const disconnectStrava = () => call('disconnect')

/**
 * Pulls synced runs from Supabase into the local run log. Never touches manual or file
 * runs; only Strava-sourced rows are created, updated or removed. Duplicate detection
 * against manual runs is handled in the UI.
 */
export async function pullStravaRuns(): Promise<number> {
  if (!supabase) return 0
  const { data, error } = await supabase.from('strava_runs').select('*').order('date', { ascending: false }).limit(500)
  if (error || !data) return 0
  const remoteIds = new Set<number>()
  for (const r of data) {
    remoteIds.add(r.strava_id)
    const id = `strava-${r.strava_id}`
    const prev = await db.runs.get(id)
    const run: Run = {
      ...prev, id, source: 'strava', stravaId: r.strava_id, date: r.date,
      distanceKm: Number(r.distance_km), durationSec: r.duration_sec,
      avgHr: r.avg_hr ?? undefined, maxHr: r.max_hr ?? undefined,
    }
    await db.runs.put(run)
  }
  const stale = (await db.runs.where('source').equals('strava').toArray()).filter((r) => r.stravaId && !remoteIds.has(r.stravaId))
  await db.runs.bulkDelete(stale.map((r) => r.id))
  return data.length
}
