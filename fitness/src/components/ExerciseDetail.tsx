import { useMemo } from 'react'
import { useFinishedSessions } from '../lib/hooks'
import { epley1RM } from '../lib/progression'
import { historyFor } from '../lib/session'
import type { Exercise } from '../types'
import LineChart from './LineChart'
import Sheet from './Sheet'

export default function ExerciseDetail({ ex, onClose }: { ex: Exercise; onClose: () => void }) {
  const sessions = useFinishedSessions()
  const hist = useMemo(() => historyFor(ex.id, sessions).reverse(), [ex.id, sessions])
  const best = Math.max(0, ...hist.flatMap((h) => h.reps.map((r) => epley1RM(h.weight, r))))
  const heaviest = Math.max(0, ...hist.map((h) => h.weight))
  return (
    <Sheet title={ex.nameHe} onClose={onClose}>
      <div className="row"><span className="tag">{ex.muscle}</span><span className="tag">{ex.equipment}</span><span className="muted small">{ex.nameEn}</span></div>
      {hist.length > 0 && (
        <div className="card stack">
          <div className="row between">
            <div><div className="label">שיא משקל</div><div className="num-sm">{heaviest} ק״ג</div></div>
            <div><div className="label">1RM משוער</div><div className="num-sm">{Math.round(best * 10) / 10} ק״ג</div></div>
          </div>
          <LineChart points={hist.map((h) => ({ x: h.date, y: h.weight }))} unit=" ק״ג" />
        </div>
      )}
      {ex.steps.length > 0 && (<section><h3>ביצוע</h3><ol className="stack" style={{ margin: '8px 0 0', paddingInlineStart: 20 }}>{ex.steps.map((s, i) => <li key={i}>{s}</li>)}</ol></section>)}
      {ex.cues.length > 0 && (<section><h3>דגשים</h3><ul style={{ margin: '8px 0 0', paddingInlineStart: 20 }}>{ex.cues.map((s, i) => <li key={i}>{s}</li>)}</ul></section>)}
      {ex.mistakes.length > 0 && (<section><h3>טעויות נפוצות</h3><ul style={{ margin: '8px 0 0', paddingInlineStart: 20 }}>{ex.mistakes.map((s, i) => <li key={i}>{s}</li>)}</ul></section>)}
      <p className="muted small">אין כאן ייעוץ רפואי. בכאב או פציעה כדאי להתייעץ עם איש מקצוע.</p>
    </Sheet>
  )
}
