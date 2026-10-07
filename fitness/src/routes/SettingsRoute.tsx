import { ChevronRight, Download, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import NumField from '../components/NumField'
import { DEFAULT_SETTINGS, db } from '../lib/db'
import { useSettings } from '../lib/hooks'
import { DEFAULT_PROGRESSION } from '../lib/progression'
import type { ProgressionSettings } from '../types'

const PROG_FIELDS: { key: keyof ProgressionSettings; label: string; pct?: boolean; hint?: string }[] = [
  { key: 'pctLower', label: 'עלייה ברגליים (%)', pct: true },
  { key: 'pctCompoundUpper', label: 'עלייה בתרגילים מורכבים עליונים (%)', pct: true },
  { key: 'pctIsolation', label: 'עלייה בבידוד (%)', pct: true },
  { key: 'sessionsAtTopBeforeRaise', label: 'אימונים בתקרת הטווח לפני עלייה' },
  { key: 'stallSessionsBeforeSuggestion', label: 'אימונים בלי התקדמות עד הצעה' },
  { key: 'deloadPct', label: 'הורדת עומס בדלוד (%)', pct: true },
  { key: 'layoffDays', label: 'ימי הפסקה עד התחלה מחדש' },
  { key: 'layoffRestartPct', label: 'משקל חזרה אחרי הפסקה (%)', pct: true },
  { key: 'bigJumpThreshold', label: 'סף קפיצה גדולה (%)', pct: true },
  { key: 'bodyweightAddKg', label: 'תוספת משקל חיצוני (ק״ג)' },
]

export default function SettingsRoute() {
  const nav = useNavigate()
  const s = useSettings()
  const setProg = (key: keyof ProgressionSettings, v: number, pct?: boolean) =>
    db.settings.put({ ...s, progression: { ...s.progression, [key]: pct ? v / 100 : v } })

  const exportAll = async () => {
    const data = { exportedAt: new Date().toISOString(), settings: s, templates: await db.templates.toArray(), sessions: await db.sessions.toArray(), customExercises: await db.customExercises.toArray(), exerciseSettings: await db.exerciseSettings.toArray(), foods: await db.foods.toArray(), meals: await db.meals.toArray(), savedMeals: await db.savedMeals.toArray(), bodyWeights: await db.bodyWeights.toArray(), runs: await db.runs.toArray() }
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    a.download = `fitness-backup-${data.exportedAt.slice(0, 10)}.json`
    a.click()
  }
  const importAll = async (file: File) => {
    try {
      const d = JSON.parse(await file.text())
      if (!d.sessions || !d.templates) throw new Error('bad')
      if (!confirm('הייבוא ידרוס את הנתונים הקיימים. להמשיך?')) return
      await db.transaction('rw', [db.settings, db.templates, db.sessions, db.customExercises, db.exerciseSettings, db.foods, db.meals, db.savedMeals, db.bodyWeights, db.runs], async () => {
        await Promise.all([db.templates.clear(), db.sessions.clear(), db.customExercises.clear(), db.exerciseSettings.clear(), db.foods.clear(), db.meals.clear(), db.savedMeals.clear(), db.bodyWeights.clear(), db.runs.clear()])
        await db.settings.put(d.settings ?? DEFAULT_SETTINGS)
        await db.templates.bulkPut(d.templates); await db.sessions.bulkPut(d.sessions)
        await db.customExercises.bulkPut(d.customExercises ?? []); await db.exerciseSettings.bulkPut(d.exerciseSettings ?? [])
        await db.foods.bulkPut(d.foods ?? []); await db.meals.bulkPut(d.meals ?? []); await db.savedMeals.bulkPut(d.savedMeals ?? []); await db.bodyWeights.bulkPut(d.bodyWeights ?? []); await db.runs.bulkPut(d.runs ?? [])
      })
    } catch { alert('הקובץ לא נראה כמו גיבוי של האפליקציה.') }
  }

  return (
    <main className="page">
      <div className="row"><button className="icon-btn" aria-label="חזרה" onClick={() => nav('/')}><ChevronRight size={22} /></button><h1>הגדרות</h1></div>

      <section className="card stack">
        <h2>מראה</h2>
        <div className="seg" role="radiogroup" aria-label="מצב תצוגה">
          {([['auto', 'לפי המכשיר'], ['light', 'בהיר'], ['dark', 'כהה']] as const).map(([v, l]) => (
            <button key={v} role="radio" aria-checked={s.theme === v} className={s.theme === v ? 'on' : ''} onClick={() => db.settings.put({ ...s, theme: v })}>{l}</button>
          ))}
        </div>
      </section>

      <section className="card stack">
        <h2>חדר כושר</h2>
        <label className="row"><span className="grow">משקל המוט (ק״ג)</span><div style={{ width: 96 }}><NumField label="משקל המוט" value={s.barKg} onChange={(v) => db.settings.put({ ...s, barKg: v })} /></div></label>
        <label className="row"><span className="grow">מנוחה ברירת מחדל (שניות)</span><div style={{ width: 96 }}><NumField label="מנוחה" decimal={false} value={s.defaultRestSec} onChange={(v) => db.settings.put({ ...s, defaultRestSec: v })} /></div></label>
      </section>

      <section className="card stack">
        <h2>הגדרות התקדמות</h2>
        <p className="muted small">אלה ערכי התחלה סבירים ולא ערכים שנקבעו במחקר. שינוי חל על ההצעות הבאות.</p>
        {PROG_FIELDS.map(({ key, label, pct }) => (
          <label key={key} className="row"><span className="grow">{label}</span>
            <div style={{ width: 96 }}><NumField label={label} value={pct ? Math.round(s.progression[key] * 1000) / 10 : s.progression[key]} onChange={(v) => setProg(key, v, pct)} /></div>
          </label>
        ))}
        <button className="btn btn-ghost" onClick={() => db.settings.put({ ...s, progression: DEFAULT_PROGRESSION })}>החזר לברירות מחדל</button>
      </section>

      <section className="card stack">
        <h2>נתונים</h2>
        <button className="btn" onClick={exportAll}><Download size={18} />ייצוא גיבוי</button>
        <label className="btn" style={{ cursor: 'pointer' }}><Upload size={18} />ייבוא גיבוי
          <input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importAll(e.target.files[0])} />
        </label>
        <p className="muted small">הנתונים נשמרים במכשיר בלבד. האפליקציה לא נותנת ייעוץ רפואי.</p>
      </section>
    </main>
  )
}
