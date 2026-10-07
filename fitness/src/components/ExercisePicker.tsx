import { Check, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { MUSCLES } from '../data/exercises'
import { db, uid } from '../lib/db'
import { useExercises } from '../lib/hooks'
import type { Category, Exercise } from '../types'
import Sheet from './Sheet'

export default function ExercisePicker({ title = 'בחירת תרגילים', multi = true, muscle: fixedMuscle, onPick, onClose }: {
  title?: string; multi?: boolean; muscle?: string; onPick: (ids: string[]) => void; onClose: () => void
}) {
  const { list } = useExercises()
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState<string | null>(fixedMuscle ?? null)
  const [sel, setSel] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const shown = list.filter((e) => (!muscle || e.muscle === muscle) && (e.nameHe.includes(q) || e.nameEn.toLowerCase().includes(q.toLowerCase())))

  if (adding) return <CustomExerciseForm onClose={() => setAdding(false)} onSaved={(id) => { setAdding(false); onPick([id]) }} />

  return (
    <Sheet title={title} onClose={onClose}>
      <div className="row"><Search size={18} className="muted" aria-hidden /><input className="field" placeholder="חיפוש תרגיל" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="chips">
        <button className={`chip ${muscle === null ? 'on' : ''}`} onClick={() => setMuscle(null)}>הכל</button>
        {MUSCLES.map((m) => <button key={m} className={`chip ${muscle === m ? 'on' : ''}`} onClick={() => setMuscle(m)}>{m}</button>)}
      </div>
      <div className="divided">
        {shown.map((e) => {
          const on = sel.includes(e.id)
          return (
            <button key={e.id} className="item-btn row" onClick={() => (multi ? setSel(on ? sel.filter((x) => x !== e.id) : [...sel, e.id]) : onPick([e.id]))}>
              <div className="grow"><div>{e.nameHe}</div><div className="label">{e.muscle} · {e.equipment}</div></div>
              {multi && (on ? <Check size={20} color="var(--accent)" /> : <Plus size={20} className="muted" />)}
            </button>
          )
        })}
        {shown.length === 0 && <p className="muted" style={{ padding: 16 }}>לא נמצא תרגיל. אפשר להוסיף תרגיל אישי.</p>}
      </div>
      <button className="btn btn-block" onClick={() => setAdding(true)}><Plus size={18} />תרגיל אישי חדש</button>
      {multi && <button className="btn btn-primary btn-block btn-lg" disabled={!sel.length} onClick={() => onPick(sel)}>הוסף {sel.length || ''} תרגילים</button>}
    </Sheet>
  )
}

export function CustomExerciseForm({ onClose, onSaved }: { onClose: () => void; onSaved?: (id: string) => void }) {
  const [name, setName] = useState('')
  const [muscle, setMuscle] = useState(MUSCLES[0])
  const [equipment, setEquipment] = useState('')
  const [step, setStep] = useState('2.5')
  const [category, setCategory] = useState<Category>('isolation')
  const save = async () => {
    const ex: Exercise = { id: `custom-${uid()}`, nameHe: name.trim(), nameEn: '', muscle, equipment: equipment.trim() || 'אחר', category, defaultStepKg: Number(step) || 2.5, steps: [], cues: [], mistakes: [], isCustom: true }
    await db.customExercises.put(ex)
    onSaved?.(ex.id)
    onClose()
  }
  return (
    <Sheet title="תרגיל אישי" onClose={onClose}>
      <input className="field" placeholder="שם התרגיל" value={name} onChange={(e) => setName(e.target.value)} />
      <select className="field" value={muscle} onChange={(e) => setMuscle(e.target.value)} aria-label="קבוצת שריר">{MUSCLES.map((m) => <option key={m}>{m}</option>)}</select>
      <input className="field" placeholder="ציוד (למשל דמבלים)" value={equipment} onChange={(e) => setEquipment(e.target.value)} />
      <select className="field" value={category} onChange={(e) => setCategory(e.target.value as Category)} aria-label="סוג תרגיל">
        <option value="lower">רגליים</option><option value="compound-upper">מורכב לפלג גוף עליון</option><option value="isolation">בידוד</option><option value="bodyweight">משקל גוף</option>
      </select>
      <label className="stack"><span className="label">צעד משקל מינימלי (ק״ג)</span><input className="field" inputMode="decimal" value={step} onChange={(e) => setStep(e.target.value)} /></label>
      <button className="btn btn-primary btn-block btn-lg" disabled={!name.trim()} onClick={save}>שמור</button>
    </Sheet>
  )
}
