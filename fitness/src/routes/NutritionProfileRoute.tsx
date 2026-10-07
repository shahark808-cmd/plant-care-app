import { useState } from 'react'
import NumField from '../components/NumField'
import { db, todayStr } from '../lib/db'
import { useSettings } from '../lib/hooks'
import { calcTargets } from '../lib/nutrition'
import type { Goal, Profile, Sex, Targets } from '../types'
import { NutritionTabs } from './NutritionRoute'

const EMPTY: Profile = { weightKg: 0, heightCm: 0, age: 0, sex: 'male', workoutsPerWeek: 3, goal: 'gain' }

export default function NutritionProfileRoute() {
  const settings = useSettings()
  const [p, setP] = useState<Profile>(settings.profile ?? EMPTY)
  const t = settings.targets
  const ok = p.weightKg > 0 && p.heightCm > 0 && p.age > 0
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((x) => ({ ...x, [k]: v }))
  const num = (label: string, k: 'weightKg' | 'heightCm' | 'age' | 'workoutsPerWeek', dec = true) => (
    <label className="stack" style={{ gap: 4 }}><span className="label">{label}</span><NumField label={label} decimal={dec} value={p[k]} onChange={(v) => set(k, v)} /></label>
  )
  const setTarget = (k: keyof Targets, v: number) => t && db.settings.put({ ...settings, targets: { ...t, [k]: v, source: 'manual', updatedAt: todayStr() } })

  return (
    <main className="page">
      <h1>תזונה</h1>
      <NutritionTabs active="profile" />
      <section className="card stack">
        <h2>הנתונים שלי</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {num('משקל (ק״ג)', 'weightKg')}{num('גובה (ס״מ)', 'heightCm', false)}{num('גיל', 'age', false)}{num('אימונים בשבוע (כולל ריצות)', 'workoutsPerWeek', false)}
        </div>
        <div className="seg" role="radiogroup" aria-label="מין">
          {([['male', 'גבר'], ['female', 'אישה']] as [Sex, string][]).map(([v, l]) => <button key={v} role="radio" aria-checked={p.sex === v} className={p.sex === v ? 'on' : ''} onClick={() => set('sex', v)}>{l}</button>)}
        </div>
        <div className="seg" role="radiogroup" aria-label="מטרה">
          {([['gain', 'עלייה'], ['maintain', 'שמירה'], ['lose', 'ירידה']] as [Goal, string][]).map(([v, l]) => <button key={v} role="radio" aria-checked={p.goal === v} className={p.goal === v ? 'on' : ''} onClick={() => set('goal', v)}>{l}</button>)}
        </div>
        <button className="btn btn-primary btn-lg" disabled={!ok} onClick={() => db.settings.put({ ...settings, profile: p, targets: calcTargets(p, todayStr()) })}>חשב יעדים</button>
      </section>

      {t && (
        <section className="card stack">
          <div className="row between"><h2>היעדים שלי</h2><span className="tag">{t.source === 'calculated' ? 'חושב' : 'ערוך ידנית'}</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {([['קלוריות', 'calories'], ['חלבון (ג׳)', 'protein'], ['פחמימות (ג׳)', 'carbs'], ['שומן (ג׳)', 'fat']] as const).map(([l, k]) => (
              <label key={k} className="stack" style={{ gap: 4 }}><span className="label">{l}</span><NumField label={l} value={t[k]} onChange={(v) => setTarget(k, v)} /></label>
            ))}
          </div>
          <p className="muted small">אלה הערכות התחלתיות. כדאי להתאים לפי מגמת המשקל. הערכים מבוססים על נוסחת Mifflin-St Jeor, ואינם ייעוץ רפואי או תזונתי.</p>
        </section>
      )}
    </main>
  )
}
