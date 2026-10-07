import { Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { CustomExerciseForm } from '../components/ExercisePicker'
import ExerciseDetail from '../components/ExerciseDetail'
import { MUSCLES } from '../data/exercises'
import { useExercises } from '../lib/hooks'
import type { Exercise } from '../types'
import { WorkoutsTabs } from './WorkoutsRoute'

export default function ExercisesRoute() {
  const { list } = useExercises()
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState<string | null>(null)
  const [open, setOpen] = useState<Exercise | null>(null)
  const [adding, setAdding] = useState(false)
  const shown = list.filter((e) => (!muscle || e.muscle === muscle) && (e.nameHe.includes(q) || e.nameEn.toLowerCase().includes(q.toLowerCase())))
  return (
    <main className="page">
      <h1>אימונים</h1>
      <WorkoutsTabs active="exercises" />
      <div className="row"><Search size={18} className="muted" aria-hidden /><input className="field" placeholder="חיפוש תרגיל" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="chips">
        <button className={`chip ${muscle === null ? 'on' : ''}`} onClick={() => setMuscle(null)}>הכל</button>
        {MUSCLES.map((m) => <button key={m} className={`chip ${muscle === m ? 'on' : ''}`} onClick={() => setMuscle(m)}>{m}</button>)}
      </div>
      <div className="card divided" style={{ padding: '4px 18px' }}>
        {shown.map((e) => (
          <button key={e.id} className="item-btn" onClick={() => setOpen(e)}>
            <div>{e.nameHe}</div><div className="label">{e.muscle} · {e.equipment}</div>
          </button>
        ))}
        {shown.length === 0 && <p className="muted" style={{ padding: 16 }}>לא נמצא תרגיל.</p>}
      </div>
      <button className="btn btn-block" onClick={() => setAdding(true)}><Plus size={18} />תרגיל אישי</button>
      {open && <ExerciseDetail ex={open} onClose={() => setOpen(null)} />}
      {adding && <CustomExerciseForm onClose={() => setAdding(false)} />}
    </main>
  )
}
