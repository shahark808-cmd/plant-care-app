import { Trophy } from 'lucide-react'
import { useFinishedSessions, useExercises } from '../lib/hooks'
import { sessionVolume } from '../lib/session'
import { WorkoutsTabs } from './WorkoutsRoute'

const fmtDate = (d: string) => new Date(d + 'T00:00').toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })

export default function HistoryRoute() {
  const sessions = useFinishedSessions()
  const { byId } = useExercises()
  return (
    <main className="page">
      <h1>אימונים</h1>
      <WorkoutsTabs active="history" />
      {sessions.length === 0 ? (
        <div className="empty"><h2>עוד אין אימונים בהיסטוריה</h2><p className="muted">אחרי האימון הראשון תראה כאן את כל מה שעשית.</p></div>
      ) : (
        sessions.map((s) => {
          const prs = s.entries.flatMap((e) => e.sets.filter((x) => x.isPR).map(() => e.exerciseId))
          return (
            <div key={s.id} className="card stack">
              <div className="row between"><h2>{s.name}</h2><span className="label">{fmtDate(s.date)}</span></div>
              <div className="label">נפח כולל {Math.round(sessionVolume(s)).toLocaleString('he-IL')} ק״ג{s.finishedAt ? ` · ${Math.max(1, Math.round((s.finishedAt - s.startedAt) / 60000))} דקות` : ''}</div>
              <div className="divided">
                {s.entries.filter((e) => e.sets.some((x) => x.done)).map((e) => (
                  <div key={e.id} className="item" style={{ alignItems: 'flex-start' }}>
                    <div className="grow">{byId.get(e.exerciseId)?.nameHe}</div>
                    <div className="label" style={{ textAlign: 'end' }}>{e.sets.filter((x) => x.done && x.kind !== 'warmup').map((x) => `${x.weight}×${x.reps}`).join('  ')}</div>
                  </div>
                ))}
              </div>
              {prs.length > 0 && <div className="row pr small"><Trophy size={16} />{prs.length} שיאים אישיים</div>}
            </div>
          )
        })
      )}
    </main>
  )
}
