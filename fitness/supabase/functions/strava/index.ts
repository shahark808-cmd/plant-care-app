// Strava integration: OAuth exchange, manual sync, status, disconnect (all require the user's JWT)
// and the Strava webhook (public by necessity; it only triggers a re-fetch of real data
// from Strava for athletes we already know, and every write is an idempotent upsert).
// Secrets required: STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_VERIFY_TOKEN.
// Optional: STRAVA_SUBSCRIPTION_ID (ignore events from other subscriptions).
// Deployed with verify_jwt=false; JWT is checked manually for every non-webhook route.
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

const RUN_TYPES = new Set(['Run', 'TrailRun', 'VirtualRun'])
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** fetch with exponential backoff on 429 / 5xx. */
async function stravaFetch(url: string, init?: RequestInit, tries = 4): Promise<Response> {
  let delay = 1000
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, init)
    if (res.status !== 429 && res.status < 500) return res
    if (i === tries - 1) return res
    await sleep(delay)
    delay *= 2
  }
  throw new Error('unreachable')
}

async function userFromRequest(req: Request) {
  const auth = req.headers.get('Authorization')
  if (!auth) return null
  const client = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } })
  const { data, error } = await client.auth.getUser()
  return error ? null : data.user
}

interface TokenRow { user_id: string; athlete_id: number; access_token: string; refresh_token: string; expires_at: string }

async function accessToken(row: TokenRow): Promise<string | null> {
  if (new Date(row.expires_at).getTime() - 60_000 > Date.now()) return row.access_token
  const res = await stravaFetch('https://www.strava.com/api/v3/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: Deno.env.get('STRAVA_CLIENT_ID'),
      client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
      grant_type: 'refresh_token',
      refresh_token: row.refresh_token,
    }),
  })
  if (!res.ok) return null
  const t = await res.json()
  await admin.from('strava_tokens').update({
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expires_at: new Date(t.expires_at * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('user_id', row.user_id)
  return t.access_token
}

// deno-lint-ignore no-explicit-any
function toRun(userId: string, a: any) {
  if (!RUN_TYPES.has(a.sport_type ?? a.type)) return null
  if (!a.distance || !a.moving_time) return null
  return {
    user_id: userId,
    strava_id: a.id,
    date: String(a.start_date_local).slice(0, 10),
    distance_km: Math.round((a.distance / 1000) * 100) / 100,
    duration_sec: Math.round(a.moving_time),
    avg_hr: a.average_heartrate ? Math.round(a.average_heartrate) : null,
    max_hr: a.max_heartrate ? Math.round(a.max_heartrate) : null,
    name: a.name ?? null,
    sport: a.sport_type ?? a.type,
  }
}

async function syncRecent(row: TokenRow, days: number): Promise<number> {
  const token = await accessToken(row)
  if (!token) throw new Error('token_refresh_failed')
  const after = Math.floor(Date.now() / 1000) - days * 86400
  let count = 0
  for (let page = 1; page <= 5; page++) {
    const res = await stravaFetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100&page=${page}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 429) throw new Error('rate_limited')
    if (!res.ok) throw new Error('strava_error')
    const acts = await res.json()
    const rows = acts.map((a: unknown) => toRun(row.user_id, a)).filter(Boolean)
    if (rows.length) {
      const { error } = await admin.from('strava_runs').upsert(rows, { onConflict: 'user_id,strava_id' })
      if (error) throw new Error('db_error')
      count += rows.length
    }
    if (acts.length < 100) break
  }
  return count
}

async function handleWebhookEvent(ev: Record<string, unknown>) {
  const expectedSub = Deno.env.get('STRAVA_SUBSCRIPTION_ID')
  if (expectedSub && String(ev.subscription_id) !== expectedSub) return
  const { data: row } = await admin.from('strava_tokens').select('*').eq('athlete_id', ev.owner_id as number).maybeSingle()
  if (!row) return

  if (ev.object_type === 'athlete') {
    // Deauthorization from Strava's side: forget the tokens.
    if ((ev.updates as Record<string, string> | undefined)?.authorized === 'false') await admin.from('strava_tokens').delete().eq('user_id', row.user_id)
    return
  }
  if (ev.object_type !== 'activity') return

  if (ev.aspect_type === 'delete') {
    await admin.from('strava_runs').delete().eq('user_id', row.user_id).eq('strava_id', ev.object_id as number)
    return
  }
  const token = await accessToken(row)
  if (!token) return
  const res = await stravaFetch(`https://www.strava.com/api/v3/activities/${ev.object_id}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) return
  const run = toRun(row.user_id, await res.json())
  if (run) await admin.from('strava_runs').upsert(run, { onConflict: 'user_id,strava_id' })
  else await admin.from('strava_runs').delete().eq('user_id', row.user_id).eq('strava_id', ev.object_id as number)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const route = new URL(req.url).pathname.split('/').filter(Boolean).pop()

  // ---- Webhook (public) ----
  if (route === 'webhook') {
    if (req.method === 'GET') {
      const q = new URL(req.url).searchParams
      if (q.get('hub.mode') === 'subscribe' && q.get('hub.verify_token') === Deno.env.get('STRAVA_VERIFY_TOKEN') && Deno.env.get('STRAVA_VERIFY_TOKEN')) {
        return json({ 'hub.challenge': q.get('hub.challenge') })
      }
      return json({ error: 'forbidden' }, 403)
    }
    if (req.method === 'POST') {
      const ev = await req.json().catch(() => null)
      if (ev) {
        // Strava expects a 200 within 2 seconds; process after responding.
        EdgeRuntime.waitUntil(handleWebhookEvent(ev).catch((e) => console.error('webhook failed', e instanceof Error ? e.message : 'error')))
      }
      return json({ ok: true })
    }
    return json({ error: 'method_not_allowed' }, 405)
  }

  // ---- Authenticated routes ----
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
  const user = await userFromRequest(req)
  if (!user) return json({ error: 'unauthorized' }, 401)
  const body = await req.json().catch(() => ({}))

  try {
    if (route === 'auth') {
      if (!body.code || typeof body.code !== 'string') return json({ error: 'missing_code' }, 400)
      const res = await stravaFetch('https://www.strava.com/api/v3/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: Deno.env.get('STRAVA_CLIENT_ID'),
          client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
          code: body.code,
          grant_type: 'authorization_code',
        }),
      })
      if (!res.ok) return json({ error: res.status === 429 ? 'rate_limited' : 'strava_rejected' }, 400)
      const t = await res.json()
      if (typeof body.scope === 'string' && !body.scope.split(',').includes('activity:read') && !body.scope.split(',').includes('activity:read_all'))
        return json({ error: 'missing_scope' }, 400)
      const row: TokenRow = {
        user_id: user.id,
        athlete_id: t.athlete.id,
        access_token: t.access_token,
        refresh_token: t.refresh_token,
        expires_at: new Date(t.expires_at * 1000).toISOString(),
      }
      const { error } = await admin.from('strava_tokens').upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      if (error) return json({ error: 'db_error' }, 500)
      const synced = await syncRecent(row, 90)
      return json({ ok: true, synced })
    }

    const { data: row } = await admin.from('strava_tokens').select('*').eq('user_id', user.id).maybeSingle()
    if (route === 'status') return json({ connected: !!row })
    if (!row) return json({ error: 'not_connected' }, 400)

    if (route === 'sync') {
      const days = Math.min(Math.max(Number(body.days) || 30, 1), 365)
      return json({ ok: true, synced: await syncRecent(row, days) })
    }
    if (route === 'disconnect') {
      const token = await accessToken(row)
      if (token) await stravaFetch('https://www.strava.com/oauth/deauthorize', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }, 1)
      await admin.from('strava_tokens').delete().eq('user_id', user.id)
      return json({ ok: true })
    }
    return json({ error: 'not_found' }, 404)
  } catch (e) {
    const code = e instanceof Error ? e.message : 'error'
    return json({ error: ['rate_limited', 'strava_error', 'db_error', 'token_refresh_failed'].includes(code) ? code : 'error' }, code === 'rate_limited' ? 429 : 500)
  }
})
