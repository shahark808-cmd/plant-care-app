import { ArrowLeftRight, Calculator, Check, ChevronRight, Flame, Minus, Plus, Trophy } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ExerciseDetail from '../components/ExerciseDetail'
import ExercisePicker from '../components/ExercisePicker'
import NumField from '../components/NumField'
import PlateCalc from '../components/PlateCalc'
import { warmupSets } from '../lib/gym'
import { db, uid } from '../lib/db'
import { useExercises, useSettings } from '../lib/hooks'
import { epley1RM } from '../lib/progression'
import { bestE1RM } from '../lib/session'
import type { Effort, SessionEntry, SetKind, SetLog, WorkoutSession } from '../types'

const KINDS: SetKind[] = ['working', 'warmup', 'drop', 'failure']
const KIND_LABEL: Record<SetKind, string> = { working: '', warmup: 'ח', drop: 'ד', failure: 'כ' }
const KIND_NAME: Record<SetKind, string> = { working: 'סט עבודה', warmup: 'חימום', drop: 'דרופ', failure: 'כשל' }

export default function SessionRoute() {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const settings = useSettings()
  const { byId } = useExercises()
  const [session, setSession] = useState<WorkoutSession | null | undefined>(undefined)
  const [rest, setRest] = useState<{ end: number; total: number } | null>(null)
  const [now, setNow] = useState(Date.now())
  const [plate, setPlate] = useState<number | null>(null)
  const [detail, setDetail] = useState<string | null>(null)
  const [swap, setSwap] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const priorBest = useRef(new Map<string, number>())

  useEffect(() => { db.sessions.get(id).then((s) => setSession(s ?? null)) }, [id])

  // Keep the screen awake while training.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    const get = () => navigator.wakeLock?.request('screen').then((l) => { lock = l }).catch(() => {})
    get()
    const vis = () => document.visibilityState === 'visible' && get()
    document.addEventListener('visibilitychange', vis)
    return () => { document.removeEventListener('visibilitychange', vis); lock?.release().catch(() => {}) }
  }, [])

  useEffect(() => {
    if (!rest) return
    const t = setInterval(() => {
      setNow(Date.now())
      if (Date.now() >= rest.end) { navigator.vibrate?.([200, 100, 200]); setRest(null) }
    }, 250)
    return () => clearInterval(t)
  }, [rest])

  const update = useCallback((fn: (s: WorkoutSession) => WorkoutSession) => {
    setSession((cur) => {
      if (!cur) return cur
      const next = fn(cur)
      db.sessions.put(next) // autosave on every change
      return next
    })
  }, [])
  const updateEntry = (eid: string, fn: (e: SessionEntry) => SessionEntry) => update((s) => ({ ...s, entries: s.entries.map((e) => (e.id === eid ? fn(e) : e)) }))
  const updateSet = (eid: string, sid: string, patch: Partial<SetLog>) => updateEntry(eid, (e) => ({ ...e, sets: e.sets.map((x) => (x.id === sid ? { ...x, ...patch } : x)) }))

  const getPrior = async (exerciseId: string) => {
    if (!priorBest.current.has(exerciseId)) {
      const fin = await db.sessions.where('finishedAt').above(0).toArray()
      priorBest.current.set(exerciseId, bestE1RM(exerciseId, fin))
    }
    return priorBest.current.get(exerciseId)!
  }

  const complete = async (entry: SessionEntry, idx: number, set: SetLog) => {
    if (set.done) return updateSet(entry.id, set.id, { done: false, isPR: false })
    let isPR = false
    if (set.kind === 'working' || set.kind === 'failure') {
      const prior = await getPrior(entry.exerciseId)
      const e1 = epley1RM(set.weight, set.reps)
      if (prior > 0 && e1 > prior + 1e-6) { isPR = true; priorBest.current.set(entry.exerciseId, e1) }
    }
    updateSet(entry.id, set.id, { done: true, isPR })
    const next = session!.entries[idx + 1]
    const inSuperset = entry.supersetGroup && next?.supersetGroup === entry.supersetGroup
    const secs = entry.restSec
    if (secs > 0 && !inSuperset && set.kind !== 'warmup') { setRest({ end: Date.now() + secs * 1000, total: secs }); setNow(Date.now()) }
  }

  const addWarmup = (entry: SessionEntry) => {
    const work = entry.sets.find((x) => x.kind === 'working')
    if (!work) return
    const bar = settings.barKg
    const w = warmupSets(work.weight, entry.step, settings.warmupPcts, byId.get(entry.exerciseId)?.equipment === 'מוט' ? bar : 0)
    updateEntry(entry.id, (e) => ({ ...e, sets: [...w.map((x): SetLog => ({ id: uid(), kind: 'warmup', weight: x.weight, reps: x.reps, done: false })), ...e.sets] }))
  }

  const finish = async () => {
    const s = session!
    const done = s.entries.map((e) => ({ ...e, sets: e.sets.filter((x) => x.done) })).filter((e) => e.sets.length)
    if (done.length === 0) {
      if (confirm('לא סומן אף סט. למחוק את האימון?')) { await db.sessions.delete(s.id); nav('/') }
      return
    }
    const finished = { ...s, entries: done, finishedAt: Date.now() }
    await db.sessions.put(finished)
    nav('/')
  }

  if (session === undefined) return <main className="page no-nav" />
  if (session === null) return <main className="page no-nav"><div className="empty"><p>האימון לא נמצא.</p><button className="btn" onClick={() => nav('/')}>חזרה</button></div></main>

  const doneSets = session.entries.reduce((a, e) => a + e.sets.filter((x) => x.done && x.kind !== 'warmup').length, 0)
  const totalSets = session.entries.reduce((a, e) => a + e.sets.filter((x) => x.kind !== 'warmup').length, 0)
  const secsLeft = rest ? Math.max(0, Math.ceil((rest.end - now) / 1000)) : 0
  const swapEntry = session.entries.find((e) => e.id === swap)

  return (
    <main className="page no-nav">
      <div className="row">
        <button className="icon-btn" aria-label="חזרה למסך הבית (האימון נשמר)" onClick={() => nav('/')}><ChevronRight size={22} /></button>
        <div className="grow"><h1>{session.name}</h1><div className="label">{doneSets} מתוך {totalSets} סטים</div></div>
      </div>
      <div className="bar" aria-hidden><i style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }} /></div>

      {session.entries.length === 0 && <div className="empty"><h2>האימון ריק</h2><p className="muted">הוסף תרגיל כדי להתחיל.</p></div>}

      {session.entries.map((entry, idx) => {
        const ex = byId.get(entry.exerciseId)
        const working = entry.sets.filter((x) => x.kind !== 'warmup')
        const allDone = working.length > 0 && working.every((x) => x.done)
        const firstWork = entry.sets.find((x) => x.kind === 'working')
        const canWarm = ex && ex.category !== 'isolation' && ex.category !== 'bodyweight' && firstWork && firstWork.weight > 0 && !entry.sets.some((x) => x.kind === 'warmup')
        return (
          <section key={entry.id} className="card stack" style={{ borderInlineStart: entry.supersetGroup ? '3px solid var(--accent)' : undefined }}>
            <div className="row between">
              <button className="item-btn grow" style={{ padding: 0 }} onClick={() => setDetail(entry.exerciseId)}>
                <h2>{ex?.nameHe ?? entry.exerciseId}</h2>
                <div className="label">{entry.lo}–{entry.hi} חזרות{entry.supersetGroup ? ' · סופר-סט' : ''}</div>
              </button>
              <button className="icon-btn" aria-label="החלף תרגיל" onClick={() => setSwap(entry.id)}><ArrowLeftRight size={20} /></button>
              <button className="icon-btn" aria-label="מחשבון דיסקיות" onClick={() => setPlate(firstWork?.weight ?? 0)}><Calculator size={20} /></button>
            </div>
            {entry.suggestionReason && <p className="notice">{entry.suggestionReason}</p>}
            {entry.note && <p className="muted small">{entry.note}</p>}

            <div className="stack" style={{ gap: 8 }}>
              <div className="set-row label"><span /><span style={{ textAlign: 'center' }}>ק״ג</span><span style={{ textAlign: 'center' }}>חזרות</span><span /></div>
              {entry.sets.map((set, i) => {
                const n = entry.sets.slice(0, i + 1).filter((x) => x.kind !== 'warmup').length
                return (
                  <div key={set.id} className={`set-row ${set.kind === 'warmup' ? 'warm' : ''}`}>
                    <button className="icon-btn" style={{ width: 28, height: 44, fontSize: 14, color: 'var(--ink-muted)' }} aria-label={`סוג סט: ${KIND_NAME[set.kind]}. לחץ לשינוי`}
                      onClick={() => updateSet(entry.id, set.id, { kind: KINDS[(KINDS.indexOf(set.kind) + 1) % KINDS.length] })}>
                      {set.kind === 'working' ? n : KIND_LABEL[set.kind]}
                    </button>
                    <NumField label="משקל" value={set.weight} onChange={(weight) => updateEntry(entry.id, (e) => ({ ...e, sets: e.sets.map((x, j) => (x.id === set.id ? { ...x, weight } : j > i && !x.done && x.kind === set.kind && x.weight === set.weight ? { ...x, weight } : x)) }))} />
                    <NumField label="חזרות" decimal={false} value={set.reps} onChange={(reps) => updateSet(entry.id, set.id, { reps })} />
                    <button className={`check ${set.done ? 'done' : ''}`} aria-label={set.done ? 'בטל סימון סט' : 'סיים סט'} aria-pressed={set.done} onClick={() => complete(entry, idx, set)}>
                      <Check size={24} />
                    </button>
                    {set.isPR && <div className="pr small row" style={{ gridColumn: '1 / -1' }}><Trophy size={16} />שיא אישי חדש</div>}
                  </div>
                )
              })}
            </div>

            <div className="row">
              <button className="btn grow" onClick={() => updateEntry(entry.id, (e) => { const l = e.sets[e.sets.length - 1]; return { ...e, sets: [...e.sets, { id: uid(), kind: 'working', weight: l?.weight ?? 0, reps: l?.reps ?? entry.lo, done: false }] } })}><Plus size={18} />סט</button>
              <button className="btn" aria-label="הסר סט אחרון" disabled={entry.sets.length === 0} onClick={() => updateEntry(entry.id, (e) => ({ ...e, sets: e.sets.slice(0, -1) }))}><Minus size={18} /></button>
              {canWarm && <button className="btn" onClick={() => addWarmup(entry)}><Flame size={18} />חימום</button>}
            </div>

            {allDone && (
              <div className="stack" style={{ gap: 8 }}>
                <span className="label">איך זה הרגיש?</span>
                <div className="seg" role="radiogroup" aria-label="דירוג מאמץ">
                  {([['easy', 'קל'], ['ok', 'מתאים'], ['very_hard', 'כבד מאוד']] as [Effort, string][]).map(([v, l]) => (
                    <button key={v} role="radio" aria-checked={entry.effort === v} className={entry.effort === v ? 'on' : ''} onClick={() => updateEntry(entry.id, (e) => ({ ...e, effort: v }))}>{l}</button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )
      })}

      <button className="btn btn-block" onClick={() => setAdding(true)}><Plus size={18} />הוסף תרגיל</button>

      {rest && (
        <div className="timer" role="timer" aria-live="off">
          <div className="grow"><div className="label" style={{ color: 'inherit', opacity: .8 }}>מנוחה</div>
            <div className="num-sm">{Math.floor(secsLeft / 60)}:{String(secsLeft % 60).padStart(2, '0')}</div></div>
          <button onClick={() => setRest({ ...rest, end: rest.end + 15000 })}>+15</button>
          <button onClick={() => setRest(null)}>דלג</button>
        </div>
      )}

      <div className="bottom-bar"><button className="btn btn-primary btn-block btn-lg" onClick={finish}>סיים אימון</button></div>

      {plate !== null && <PlateCalc initial={plate} bar={settings.barKg} plates={settings.plates} onClose={() => setPlate(null)} />}
      {detail && byId.get(detail) && <ExerciseDetail ex={byId.get(detail)!} onClose={() => setDetail(null)} />}
      {swapEntry && (
        <ExercisePicker title="החלפת תרגיל" multi={false} muscle={byId.get(swapEntry.exerciseId)?.muscle} onClose={() => setSwap(null)}
          onPick={([newId]) => { updateEntry(swapEntry.id, (e) => ({ ...e, exerciseId: newId, suggestionReason: undefined })); setSwap(null) }} />
      )}
      {adding && (
        <ExercisePicker onClose={() => setAdding(false)} onPick={(ids) => {
          update((s) => ({ ...s, entries: [...s.entries, ...ids.map((eid): SessionEntry => {
            const ex = byId.get(eid)
            return { id: uid(), exerciseId: eid, lo: 8, hi: 12, step: ex?.defaultStepKg ?? 2.5, restSec: settings.defaultRestSec, sets: Array.from({ length: 3 }, () => ({ id: uid(), kind: 'working', weight: 0, reps: 8, done: false })) }
          })] }))
          setAdding(false)
        }} />
      )}
    </main>
  )
}
