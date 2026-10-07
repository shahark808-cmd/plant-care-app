import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Copy, Plus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { db, uid } from '../lib/db'
import { useExercises, useSettings } from '../lib/hooks'
import { startEmptySession, startSessionFromTemplate } from '../lib/session'
import type { WorkoutTemplate } from '../types'

export const WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

export function WorkoutsTabs({ active }: { active: 'mine' | 'exercises' | 'history' }) {
  return (
    <div className="seg" role="tablist">
      <Link to="/workouts" className={active === 'mine' ? 'on' : ''}>האימונים שלי</Link>
      <Link to="/workouts/exercises" className={active === 'exercises' ? 'on' : ''}>תרגילים</Link>
      <Link to="/workouts/history" className={active === 'history' ? 'on' : ''}>היסטוריה</Link>
    </div>
  )
}

export default function WorkoutsRoute() {
  const templates = useLiveQuery(async () => (await db.templates.toArray()).sort((a, b) => (a.weekday ?? 9) - (b.weekday ?? 9) || a.createdAt - b.createdAt), [], [] as WorkoutTemplate[])
  const nav = useNavigate()
  const { byId } = useExercises()
  const settings = useSettings()

  const create = async () => {
    const t: WorkoutTemplate = { id: uid(), name: 'אימון חדש', items: [], createdAt: Date.now() }
    await db.templates.add(t)
    nav(`/workouts/${t.id}`)
  }
  const duplicate = async (t: WorkoutTemplate) => {
    const copy = { ...t, id: uid(), name: `${t.name} (עותק)`, createdAt: Date.now(), items: t.items.map((i) => ({ ...i, id: uid() })) }
    await db.templates.add(copy)
  }
  const start = async (t: WorkoutTemplate) => nav(`/session/${await startSessionFromTemplate(t, byId, settings)}`)

  return (
    <main className="page">
      <h1>אימונים</h1>
      <WorkoutsTabs active="mine" />
      {templates.length === 0 ? (
        <div className="empty"><h2>עוד אין אימונים</h2><p className="muted">בנה אימון ראשון מתוך מאגר התרגילים.</p></div>
      ) : (
        templates.map((t) => (
          <div key={t.id} className="card stack">
            <Link to={`/workouts/${t.id}`} className="row between">
              <div>
                <h2>{t.name}</h2>
                <p className="label">{t.items.length} תרגילים{t.weekday != null ? ` · יום ${WEEKDAYS[t.weekday]}` : ''}</p>
              </div>
              <ChevronLeft size={20} className="muted" aria-hidden />
            </Link>
            <div className="row">
              <button className="btn btn-primary grow" disabled={!t.items.length} onClick={() => start(t)}>התחל</button>
              <button className="icon-btn" aria-label="שכפל אימון" onClick={() => duplicate(t)}><Copy size={20} /></button>
            </div>
          </div>
        ))
      )}
      <button className="btn btn-block" onClick={create}><Plus size={18} />אימון חדש</button>
      <button className="btn btn-ghost btn-block" onClick={async () => nav(`/session/${await startEmptySession()}`)}>אימון חופשי בלי תבנית</button>
    </main>
  )
}
