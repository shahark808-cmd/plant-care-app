import { useLiveQuery } from 'dexie-react-hooks'
import { Check, HeartPulse } from 'lucide-react'
import { useState } from 'react'
import Sheet from '../components/Sheet'
import { PLAN_WEEKDAYS, RUN_PLAN } from '../data/runPlan'
import { db, todayStr } from '../lib/db'
import { useSettings } from '../lib/hooks'
import { addDays, weekStart, weeklyKm } from '../lib/running'
import type { Run } from '../types'
import { PainNotice, RunningTabs, useLegSessionTimes } from './RunningRoute'

const DAY = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

export function planWeekIndex(start: string | undefined, today: string): number | null {
  if (!start) return null
  const days = Math.floor((Date.parse(today) - Date.parse(start)) / 86_400_000)
  return days < 0 ? null : Math.floor(days / 7)
}

export default function RunPlanRoute() {
  const settings = useSettings()
  const runs = useLiveQuery(() => db.runs.toArray(), [], [] as Run[])
  const legs = useLegSessionTimes()
  const [off, setOff] = useState(false)
  const today = todayStr()
  const idx = planWeekIndex(settings.runPlanStart, today)
  const setStart = (d: string | undefined) => db.settings.put({ ...settings, runPlanStart: d })

  if (idx === null) {
    return (
      <main className="page">
        <h1>ריצה</h1>
        <RunningTabs active="plan" />
        <div className="empty">
          <h2>תוכנית 10 ק״מ ב-12 שבועות</h2>
          <p className="muted">שלוש ריצות בשבוע: שתיים קלות וריצה ארוכה בשבת. הכול בקצב שיחה, והתוכנית ניתנת לדילוג או חזרה על שבוע.</p>
          <button className="btn btn-primary btn-lg" onClick={() => setStart(weekStart(today))}>התחל מהשבוע הזה</button>
        </div>
      </main>
    )
  }

  const w = RUN_PLAN[Math.min(idx, RUN_PLAN.length - 1)]
  const finished = idx >= RUN_PLAN.length
  const start = weekStart(addDays(settings.runPlanStart!, idx * 7))
  const end = addDays(start, 6)
  const weekRuns = runs.filter((r) => r.date >= start && r.date <= end)
  const longest = Math.max(0, ...weekRuns.map((r) => r.distanceKm))
  const todayDow = new Date(today + 'T12:00').getDay()
  const isRunDay = [...PLAN_WEEKDAYS.easy, PLAN_WEEKDAYS.long].includes(todayDow as never)
  const tomorrowRest = !isRunDay
  const legDays = new Set(legs.map((t) => new Date(t).getDay()))

  return (
    <main className="page">
      <h1>ריצה</h1>
      <RunningTabs active="plan" />

      {finished ? (
        <div className="empty"><h2>סיימת את התוכנית</h2><p className="muted">כל הכבוד. אפשר להתחיל מחדש או להמשיך לפי הקצב שלך.</p><button className="btn" onClick={() => setStart(undefined)}>איפוס התוכנית</button></div>
      ) : (
        <>
          <section className="card stack">
            <div className="row between"><div><div className="label">שבוע {w.week} מתוך 12</div><h2>{w.title}</h2></div><span className="tag">{weekRuns.length} מתוך 3 ריצות</span></div>
            <div className="bar" aria-hidden><i style={{ width: `${Math.min(100, (weekRuns.length / 3) * 100)}%` }} /></div>
            <div className="divided">
              {PLAN_WEEKDAYS.easy.map((d) => <div key={d} className="item"><span style={{ width: 56 }} className="label">{DAY[d]}</span><span className="grow">{w.easy}</span></div>)}
              <div className="item"><span style={{ width: 56 }} className="label">{DAY[PLAN_WEEKDAYS.long]}</span><span className="grow"><strong>ארוכה:</strong> {w.long}</span>
                {longest >= w.longKm * 0.9 && <Check size={18} color="var(--success)" aria-label="בוצע" />}</div>
            </div>
            <p className="label">בוצעו {weeklyKm(runs, start)} ק״מ השבוע, יעד הריצה הארוכה כ-{w.longKm} ק״מ ובה {longest} ק״מ. אחרי הריצה הארוכה מומלץ יום מנוחה.</p>
            {w.note && <p className="notice">{w.note}</p>}
            {legDays.size > 0 && [...PLAN_WEEKDAYS.easy, PLAN_WEEKDAYS.long].some((d) => legDays.has(d)) && (
              <p className="label">ריצה קלה ביום אימון רגליים כבד היא בסדר אם היא באמת קלה. ריצה איכותית כדאי להפריד מאימון רגליים ב-24 שעות לפחות.</p>
            )}
          </section>

          <button className="btn btn-block" onClick={() => setOff(true)}><HeartPulse size={18} />לא מרגיש 100%</button>
          <div className="row">
            <button className="btn grow" onClick={() => setStart(addDays(settings.runPlanStart!, 7))}>חזור על השבוע</button>
            <button className="btn grow" onClick={() => setStart(addDays(settings.runPlanStart!, -7))}>דלג לשבוע הבא</button>
          </div>
          <PainNotice />
        </>
      )}

      {off && (
        <Sheet title="לא מרגיש 100%" onClose={() => setOff(false)}>
          <p>{isRunDay ? 'להיום מומלץ לקצר ולהקל:' : 'אין ריצה מתוכננת להיום, ואפשר לנוח:'}</p>
          <ul style={{ paddingInlineStart: 20 }}>
            <li>ריצה קלה של 15 עד 20 דקות בקצב שיחה, או הליכה מהירה במקום.</li>
            <li>אם יש חום, כאב חד או סחרחורת, עדיף לדלג לגמרי.</li>
            <li>מחר חוזרים לתוכנית בהדרגה, בלי להשלים את מה שהוחמץ.</li>
            {tomorrowRest && <li>מחר יום מנוחה בתוכנית, אז יש זמן להתאושש.</li>}
          </ul>
          <button className="btn btn-primary btn-block" onClick={() => setOff(false)}>הבנתי</button>
        </Sheet>
      )}
    </main>
  )
}
