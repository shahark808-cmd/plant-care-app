import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { authorizeUrl, disconnectStrava, exchangeCode, friendly, pullStravaRuns, requestSync, stravaStatus } from '../lib/strava'
import { stravaClientId, supabase } from '../lib/supabase'

export default function Connections() {
  const [session, setSession] = useState<Session | null>(null)
  const [connected, setConnected] = useState<boolean | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  // Returning from Strava's authorization page: ?code=...&scope=...
  useEffect(() => {
    if (!session) return
    const q = new URLSearchParams(location.search)
    const code = q.get('code')
    if (code) {
      history.replaceState(null, '', location.pathname)
      setBusy(true)
      exchangeCode(code, q.get('scope') ?? '').then(async (r) => {
        if (r.error) setMsg(friendly(r.error))
        else { await pullStravaRuns(); setMsg(`החיבור הצליח. סונכרנו ${r.synced ?? 0} ריצות.`) }
        setConnected(!r.error)
        setBusy(false)
      })
    } else stravaStatus().then((r) => setConnected(r.error ? null : !!r.connected))
  }, [session])

  if (!supabase) return <p className="muted small">החיבור לשרת לא מוגדר בגרסה הזו, והאפליקציה עובדת מקומית בלבד.</p>

  const signIn = async (up: boolean) => {
    setBusy(true); setMsg('')
    const { error, data } = up ? await supabase!.auth.signUp({ email, password }) : await supabase!.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setMsg(up ? 'ההרשמה לא הצליחה. בדוק את הכתובת והסיסמה (לפחות 6 תווים).' : 'ההתחברות לא הצליחה. בדוק את הכתובת והסיסמה.')
    else if (up && !data.session) setMsg('נשלח אליך מייל אישור. אחרי האישור אפשר להתחבר.')
  }
  const run = async (fn: () => Promise<{ error?: string; synced?: number }>, ok: string) => {
    setBusy(true); setMsg('')
    const r = await fn()
    if (r.error) setMsg(friendly(r.error))
    else { const n = await pullStravaRuns(); setMsg(`${ok} (${n} ריצות בסך הכול)`) }
    setBusy(false)
  }

  if (!session) {
    return (
      <div className="stack">
        <p className="muted small">התחברות נדרשת כדי לחבר את Strava ולשמור נתונים בצורה מאובטחת. האימונים והתזונה ממשיכים לעבוד גם בלי.</p>
        <input className="field" type="email" autoComplete="email" placeholder="אימייל" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="field" type="password" autoComplete="current-password" placeholder="סיסמה" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="row"><button className="btn btn-primary grow" disabled={busy || !email || password.length < 6} onClick={() => signIn(false)}>התחבר</button>
          <button className="btn grow" disabled={busy || !email || password.length < 6} onClick={() => signIn(true)}>הרשמה</button></div>
        {msg && <p className="notice">{msg}</p>}
      </div>
    )
  }
  return (
    <div className="stack">
      <div className="row between"><span className="small muted">{session.user.email}</span><button className="btn btn-ghost" onClick={() => supabase!.auth.signOut()}>התנתק</button></div>
      <div className="row between"><span>Strava (דרך Garmin)</span><span className="tag">{connected === null ? '...' : connected ? 'מחובר' : 'לא מחובר'}</span></div>
      {!connected && (stravaClientId
        ? <a className="btn btn-primary" href={authorizeUrl()} aria-disabled={busy}>חבר את Strava</a>
        : <p className="notice">חסר מזהה אפליקציית Strava (VITE_STRAVA_CLIENT_ID). אחרי שיוצרים אפליקציה ב-Strava מגדירים אותו וטוענים מחדש.</p>)}
      {connected && (
        <div className="row">
          <button className="btn btn-primary grow" disabled={busy} onClick={() => run(() => requestSync(30), 'הסנכרון הסתיים')}>סנכרן עכשיו</button>
          <button className="btn btn-danger" disabled={busy} onClick={() => confirm('לנתק את Strava? הריצות שכבר סונכרנו יישארו.') && run(async () => { const r = await disconnectStrava(); if (!r.error) setConnected(false); return r }, 'החיבור נותק')}>נתק</button>
        </div>
      )}
      {msg && <p className="notice">{msg}</p>}
      <p className="label">הטוקנים של Strava נשמרים בשרת בלבד ולא מגיעים למכשיר. מסונכרנות רק ריצות.</p>
    </div>
  )
}
