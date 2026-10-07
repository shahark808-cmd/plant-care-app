import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import LineChart from '../components/LineChart'
import NumField from '../components/NumField'
import { db, todayStr } from '../lib/db'
import { useSettings } from '../lib/hooks'
import { calorieAdvice, ema } from '../lib/nutrition'
import type { BodyWeight } from '../types'
import { NutritionTabs } from './NutritionRoute'

export default function WeightRoute() {
  const rows = useLiveQuery(() => db.bodyWeights.orderBy('date').toArray(), [], [] as BodyWeight[])
  const settings = useSettings()
  const last = rows[rows.length - 1]
  const [kg, setKg] = useState(0)
  const value = kg || last?.kg || settings.profile?.weightKg || 0
  const smooth = ema(rows.map((r) => r.kg))
  const trend = rows.map((r, i) => ({ date: r.date, kg: smooth[i] }))
  const advice = settings.profile && settings.targets ? calorieAdvice(settings.profile.goal, trend) : null
  const weekAgo = trend.filter((t) => t.date <= todayStr(new Date(Date.now() - 7 * 86_400_000))).pop()
  const delta = weekAgo && trend.length ? Math.round((trend[trend.length - 1].kg - weekAgo.kg) * 10) / 10 : null

  return (
    <main className="page">
      <h1>תזונה</h1>
      <NutritionTabs active="weight" />
      <section className="card stack">
        <div className="label">שקילה של היום</div>
        <div className="row"><div className="grow"><NumField label="משקל בק״ג" value={value} onChange={setKg} /></div><span className="muted">ק״ג</span></div>
        <button className="btn btn-primary btn-lg" disabled={value <= 0} onClick={() => { db.bodyWeights.put({ date: todayStr(), kg: value }); setKg(0) }}>שמור</button>
      </section>

      {rows.length === 0 ? (
        <div className="empty"><h2>עוד אין שקילות</h2><p className="muted">שקילה בבוקר כמה פעמים בשבוע מספיקה כדי לראות מגמה.</p></div>
      ) : (
        <section className="card stack">
          <div className="row between">
            <div><div className="num">{trend[trend.length - 1].kg}</div><div className="label">ממוצע נע, ק״ג</div></div>
            {delta !== null && <div style={{ textAlign: 'end' }}><div className="num-sm">{delta > 0 ? '+' : ''}{delta}</div><div className="label">מול לפני שבוע</div></div>}
          </div>
          <LineChart points={trend.slice(-60).map((t) => ({ x: t.date, y: t.kg }))} unit=" ק״ג" />
          <p className="label">הממוצע הנע מרגיע את התנודות היומיות, וההחלטות נעשות לפי המגמה ולא לפי שקילה בודדת.</p>
        </section>
      )}

      {advice && settings.targets && (
        <section className="card stack">
          <h2>התאמה מוצעת</h2>
          <p>{advice.reason}.</p>
          <button className="btn btn-primary" onClick={() => db.settings.put({ ...settings, targets: { ...settings.targets!, calories: settings.targets!.calories + advice.kcalDelta, source: 'manual', updatedAt: todayStr() } })}>הוסף {advice.kcalDelta} קלוריות ליעד</button>
        </section>
      )}

      {rows.length > 0 && (
        <section className="card divided" style={{ padding: '4px 18px' }}>
          {[...rows].reverse().slice(0, 10).map((r) => (
            <div key={r.date} className="item"><span className="grow">{new Date(r.date + 'T12:00').toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}</span><span className="num-sm">{r.kg}</span>
              <button className="btn btn-ghost btn-danger" onClick={() => db.bodyWeights.delete(r.date)}>מחק</button></div>
          ))}
        </section>
      )}
    </main>
  )
}
