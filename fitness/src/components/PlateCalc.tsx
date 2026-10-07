import { useState } from 'react'
import { plateBreakdown } from '../lib/gym'
import NumField from './NumField'
import Sheet from './Sheet'

export default function PlateCalc({ initial, bar, plates, onClose }: { initial: number; bar: number; plates: number[]; onClose: () => void }) {
  const [target, setTarget] = useState(initial || bar)
  const { perSide, remainder } = plateBreakdown(target, bar, plates)
  return (
    <Sheet title="מחשבון דיסקיות" onClose={onClose}>
      <label className="stack"><span className="label">משקל כולל (ק״ג), מוט {bar} ק״ג</span><NumField label="משקל כולל" value={target} onChange={setTarget} /></label>
      {target < bar ? <p className="muted">המשקל קטן ממשקל המוט.</p> : (
        <div className="card stack">
          <div className="label">לכל צד</div>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {perSide.length === 0 ? <span className="muted">מוט ריק</span> : perSide.map((p, i) => <span key={i} className="chip on" style={{ display: 'inline-flex', alignItems: 'center' }}>{p}</span>)}
          </div>
          {remainder > 0 && <p className="small" style={{ color: 'var(--danger)' }}>חסרים {remainder} ק״ג שאי אפשר להרכיב עם הדיסקיות הקיימות.</p>}
        </div>
      )}
    </Sheet>
  )
}
