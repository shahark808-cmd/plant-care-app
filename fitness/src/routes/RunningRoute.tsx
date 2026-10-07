import { useLiveQuery } from 'dexie-react-hooks'
import { AlertTriangle, FileUp, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import InsightCard from '../components/InsightCard'
import { useInsights } from '../lib/useInsights'
import NumField from '../components/NumField'
import Sheet from '../components/Sheet'
import { pullStravaRuns } from '../lib/strava'
import { supabase } from '../lib/supabase'
import { db, todayStr, uid } from '../lib/db'
import { useFinishedSessions, useExercises } from '../lib/hooks'
import { findDuplicates, formatDuration, formatPace, legsConflicts, mergeRuns, parseDuration, parseGpx, paceSecPerKm, volumeSpike, weeklyKm } from '../lib/running'
import type { Run, RunFeel } from '../types'

export function RunningTabs({ active }: { active: 'runs' | 'plan' }) {
  return (
    <nav className="seg" aria-label="חלוקה למסכים">
      <Link to="/running" className={active === 'runs' ? 'on' : ''} aria-current={active === 'runs' ? 'page' : undefined}>הריצות שלי</Link>
      <Link to="/running/plan" className={active === 'plan' ? 'on' : ''} aria-current={active === 'plan' ? 'page' : undefined}>תוכנית 10 ק״מ</Link>
    </nav>
  )
}

const SOURCE: Record<Run['source'], string> = { manual: 'ידני', strava: 'Strava', file: 'קובץ' }
const FEEL: [RunFeel, string][] = [['easy', 'קל'], ['ok', 'מתאים'], ['hard', 'קשה'], ['pain', 'כאב']]
const fmtDate = (d: string) => new Date(d + 'T12:00').toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })

export function PainNotice() {
  return <p className="notice" style={{ background: 'var(--surface-alt)', color: 'var(--ink)' }}>כאב חד בברך, בשוק או בעקב שמחמיר בריצה הוא סימן לרדת בנפח ולהתייעץ עם איש מקצוע. האפליקציה לא מחליפה ייעוץ רפואי.</p>
}

export function useLegSessionTimes(): number[] {
  const sessions = useFinishedSessions()
  const { byId } = useExercises()
  return sessions
    .filter((s) => s.entries.reduce((n, e) => n + (byId.get(e.exerciseId)?.category === 'lower' ? e.sets.filter((x) => x.done && x.kind !== 'warmup').length : 0), 0) >= 6)
    .map((s) => s.finishedAt ?? Date.parse(s.date + 'T18:00'))
}

export default function RunningRoute() {
  const runs = useLiveQuery(async () => (await db.runs.toArray()).sort((a, b) => b.date.localeCompare(a.date)), [], [] as Run[])
  const [editing, setEditing] = useState<{ run: Run | null; isNew: boolean } | null>(null)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [msg, setMsg] = useState('')
  useEffect(() => { if (supabase) supabase.auth.getSession().then(({ data }) => data.session && pullStravaRuns().catch(() => {})) }, [])
  const today = todayStr()
  const insight = useInsights('run')[0]
  const spike = volumeSpike(runs, today)
  const dups = findDuplicates(runs).filter(([m, o]) => !dismissed.includes(m.id + o.id))
  const wk = weeklyKm(runs, today)

  const importGpx = async (file: File) => {
    const g = parseGpx(await file.text())
    if (!g) return setMsg('לא הצלחתי לקרוא את הקובץ. כרגע נתמך GPX עם נתוני זמן ומיקום.')
    setMsg('')
    setEditing({ isNew: true, run: { id: uid(), source: 'file', ...g } })
  }

  return (
    <main className="page">
      <h1>ריצה</h1>
      <RunningTabs active="runs" />
      <section className="card row between">
        <div><div className="num">{wk}</div><div className="label">ק״מ השבוע</div></div>
        <div style={{ textAlign: 'end' }}><div className="num-sm">{runs.filter((r) => r.date >= today.slice(0, 8) + '01').length}</div><div className="label">ריצות החודש</div></div>
      </section>

      {spike && (
        <div className="card row" style={{ borderColor: 'var(--highlight)' }}>
          <AlertTriangle size={22} color="var(--highlight)" aria-hidden />
          <p className="grow">הנפח השבועי עלה ב-{spike.pct}% ({spike.prevKm} ← {spike.curKm} ק״מ). עלייה של יותר מכ-10% בשבוע מעלה סיכון לעומס יתר, כדאי לשמור על ריצות קלות.</p>
        </div>
      )}

      {insight && <InsightCard insight={insight} />}

      {dups.map(([m, o]) => (
        <div key={m.id + o.id} className="card stack">
          <p>נראה שהריצה מ-{fmtDate(m.date)} רשומה פעמיים (ידנית ומ{SOURCE[o.source]}). לאחד?</p>
          <div className="row">
            <button className="btn btn-primary grow" onClick={async () => { await db.runs.put(mergeRuns(m, o)); await db.runs.delete(o.id) }}>אחד, שומר את הרישום הידני</button>
            <button className="btn grow" onClick={() => setDismissed([...dismissed, m.id + o.id])}>השאר נפרד</button>
          </div>
        </div>
      ))}

      {runs.length === 0 ? (
        <div className="empty"><h2>עוד אין ריצות</h2><p className="muted">רשום ריצה ראשונה, או התחל בתוכנית 10 ק״מ.</p></div>
      ) : (
        <div className="card divided" style={{ padding: '4px 18px' }}>
          {runs.map((r) => (
            <button key={r.id} className="item-btn row" onClick={() => setEditing({ run: r, isNew: false })}>
              <div className="grow"><div>{fmtDate(r.date)}{r.quality ? ' · איכותית' : ''}</div>
                <div className="label">{formatDuration(r.durationSec)} · {formatPace(paceSecPerKm(r.distanceKm, r.durationSec))} /ק״מ{r.avgHr ? ` · ${r.avgHr} פעימות` : ''} · {SOURCE[r.source]}</div></div>
              <div className="num-sm">{r.distanceKm}<span className="label"> ק״מ</span></div>
            </button>
          ))}
        </div>
      )}
      {msg && <p className="notice">{msg}</p>}
      <button className="btn btn-primary btn-lg btn-block" onClick={() => setEditing({ run: null, isNew: true })}><Plus size={20} />רשום ריצה</button>
      <label className="btn btn-block" style={{ cursor: 'pointer' }}><FileUp size={18} />ייבוא קובץ GPX
        <input type="file" accept=".gpx,application/gpx+xml,text/xml" hidden onChange={(e) => e.target.files?.[0] && importGpx(e.target.files[0])} />
      </label>
      {editing && <RunSheet run={editing.run} isNew={editing.isNew} onClose={() => setEditing(null)} />}
    </main>
  )
}

function RunSheet({ run, isNew, onClose }: { run: Run | null; isNew: boolean; onClose: () => void }) {
  const [date, setDate] = useState(run?.date ?? todayStr())
  const [km, setKm] = useState(run?.distanceKm ?? 0)
  const [time, setTime] = useState(run ? formatDuration(run.durationSec) : '')
  const [avgHr, setAvgHr] = useState(run?.avgHr ?? 0)
  const [feel, setFeel] = useState<RunFeel | undefined>(run?.feel)
  const [quality, setQuality] = useState(!!run?.quality)
  const [note, setNote] = useState(run?.note ?? '')
  const legs = useLegSessionTimes()
  const sec = parseDuration(time)
  const readOnly = !isNew && !!run && run.source !== 'manual'
  const conflict = quality ? legsConflicts(Date.parse(date + 'T12:00'), legs).length > 0 : false

  const save = async () => {
    const saved: Run = { id: run?.id ?? uid(), source: run?.source ?? 'manual', stravaId: run?.stravaId, maxHr: run?.maxHr, date, distanceKm: km, durationSec: sec, avgHr: avgHr || undefined, feel, quality, note: note.trim() || undefined }
    await db.runs.put(saved)
    onClose()
  }
  return (
    <Sheet title={isNew ? 'רישום ריצה' : 'פרטי ריצה'} onClose={onClose}>
      <label className="stack" style={{ gap: 4 }}><span className="label">תאריך</span><input className="field" type="date" max={todayStr()} value={date} disabled={readOnly} onChange={(e) => setDate(e.target.value)} /></label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <label className="stack" style={{ gap: 4 }}><span className="label">מרחק (ק״מ)</span><NumField label="מרחק" value={km} onChange={setKm} /></label>
        <label className="stack" style={{ gap: 4 }}><span className="label">זמן (דק׳ או ש:דד:שש)</span><input className="field" aria-label="זמן" inputMode="numeric" placeholder="32:10" value={time} disabled={readOnly} onChange={(e) => setTime(e.target.value)} /></label>
      </div>
      {km > 0 && sec > 0 && <div className="card row between"><span className="label">קצב ממוצע</span><span className="num-sm">{formatPace(paceSecPerKm(km, sec))} /ק״מ</span></div>}
      <label className="stack" style={{ gap: 4 }}><span className="label">דופק ממוצע (אופציונלי)</span><NumField label="דופק ממוצע" decimal={false} value={avgHr} onChange={setAvgHr} /></label>
      {run?.maxHr && <p className="label">דופק מקסימלי {run.maxHr}</p>}
      <div className="seg" role="radiogroup" aria-label="תחושה">
        {FEEL.map(([v, l]) => <button key={v} role="radio" aria-checked={feel === v} className={feel === v ? 'on' : ''} onClick={() => setFeel(feel === v ? undefined : v)}>{l}</button>)}
      </div>
      {feel === 'pain' && <PainNotice />}
      <label className="row"><input type="checkbox" checked={quality} onChange={(e) => setQuality(e.target.checked)} />ריצה איכותית או קשה (אינטרוולים, טמפו)</label>
      {conflict && <p className="notice" style={{ background: 'var(--surface-alt)', color: 'var(--ink)' }}>יש אימון רגליים כבד בטווח של 24 שעות מהריצה הזו. כדאי להפריד ביניהם, למשל להזיז את הריצה או לעשות אותה קלה.</p>}
      <textarea className="field" placeholder="הערה" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="btn btn-primary btn-block btn-lg" disabled={km <= 0 || sec <= 0} onClick={save}>שמור</button>
      {!isNew && <button className="btn btn-ghost btn-danger btn-block" onClick={async () => { if (confirm('למחוק את הריצה?')) { await db.runs.delete(run!.id); onClose() } }}>מחק</button>}
    </Sheet>
  )
}

