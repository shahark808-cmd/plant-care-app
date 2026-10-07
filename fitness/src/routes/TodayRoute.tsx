import { useLiveQuery } from 'dexie-react-hooks'
import { Play, Settings } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db, todayStr } from '../lib/db'
import { useExercises, useFinishedSessions, useSettings } from '../lib/hooks'
import { daysBetween, deloadSignal } from '../lib/progression'
import { PLAN_WEEKDAYS, RUN_PLAN } from '../data/runPlan'
import { weeklyKm } from '../lib/running'
import { planWeekIndex } from './RunPlanRoute'
import { Progress } from './NutritionRoute'
import { sumMacros } from '../lib/nutrition'
import InsightCard from '../components/InsightCard'
import { weeklyStreak } from '../lib/insights'
import { useInsights } from '../lib/useInsights'
import { addDays, weekStart } from '../lib/running'
import { lightWeekActive, sessionVolume, startSessionFromTemplate, stalledExerciseIds, weeklySetsByMuscle } from '../lib/session'
import type { WorkoutTemplate } from '../types'
import { WEEKDAYS } from './WorkoutsRoute'

const greeting = () => {
  const h = new Date().getHours()
  return h < 5 ? 'לילה טוב' : h < 12 ? 'בוקר טוב' : h < 18 ? 'צהריים טובים' : 'ערב טוב'
}
const TRACKED = ['חזה', 'גב', 'כתפיים', 'קוואדס', 'ירך אחורית', 'ביצפס', 'טריצפס']

export default function TodayRoute() {
  const nav = useNavigate()
  const settings = useSettings()
  const { byId } = useExercises()
  const finished = useFinishedSessions()
  const templates = useLiveQuery(() => db.templates.toArray(), [], [] as WorkoutTemplate[])
  const active = useLiveQuery(() => db.sessions.filter((s) => !s.finishedAt).first(), [])
  const today = todayStr()
  const meals = useLiveQuery(() => db.meals.where('date').equals(todayStr()).toArray(), [], [])
  const runs = useLiveQuery(() => db.runs.toArray(), [], [])
  const planIdx = planWeekIndex(settings.runPlanStart, todayStr())
  const planWeek = planIdx !== null && planIdx < RUN_PLAN.length ? RUN_PLAN[planIdx] : null
  const runToday = planWeek && (PLAN_WEEKDAYS.easy as readonly number[]).includes(new Date().getDay()) ? planWeek.easy : planWeek && new Date().getDay() === PLAN_WEEKDAYS.long ? `ארוכה: ${planWeek.long}` : null
  const eaten = sumMacros(meals.flatMap((m) => m.items))
  const weekday = new Date().getDay()

  const planned = templates.find((t) => t.weekday === weekday) ?? null
  const fallback = useMemo(() => {
    // No plan for today: suggest the template that was done least recently.
    const last = new Map<string, string>()
    finished.forEach((s) => s.templateId && !last.has(s.templateId) && last.set(s.templateId, s.date))
    return [...templates].filter((t) => t.items.length).sort((a, b) => (last.get(a.id) ?? '').localeCompare(last.get(b.id) ?? ''))[0] ?? null
  }, [templates, finished])
  const tpl = planned ?? fallback

  const last7 = todayStr(new Date(Date.now() - 6 * 86_400_000))
  const week = finished.filter((s) => s.date >= last7)
  const sets = weeklySetsByMuscle(finished, byId, last7)

  const deload = useMemo(() => {
    const since = settings.lastDeload ?? finished[finished.length - 1]?.date
    if (!since || (settings.deloadSnoozeUntil && settings.deloadSnoozeUntil > today)) return null
    const stalled = stalledExerciseIds(finished, byId, settings, today).length
    const veryHard = finished.filter((s) => daysBetween(s.date, today) <= 14).flatMap((s) => s.entries).filter((e) => e.effort === 'very_hard').length
    return deloadSignal(Math.floor(daysBetween(since, today) / 7), stalled, veryHard)
  }, [finished, settings, byId, today])

  const insights = useInsights()
  const goal = settings.weeklyGoal ?? 3
  const weekCounts = useMemo(() => {
    const count = (ws: string) => finished.filter((s) => s.date >= ws && s.date <= addDays(ws, 6)).length + runs.filter((r) => r.date >= ws && r.date <= addDays(ws, 6)).length
    const thisWeek = weekStart(today)
    const first = finished[finished.length - 1]?.date ?? runs.map((r) => r.date).sort()[0]
    if (!first) return { done: [] as number[], cur: 0 }
    const done: number[] = []
    for (let ws = weekStart(first); ws < thisWeek; ws = addDays(ws, 7)) done.push(count(ws))
    return { done, cur: count(thisWeek) }
  }, [finished, runs, today])
  const streak = weeklyStreak(weekCounts.done, weekCounts.cur, goal)
  const proteinWeek = useLiveQuery(async () => {
    const ms = (await db.meals.where('date').aboveOrEqual(last7).toArray())
    const days = new Map<string, number>()
    ms.forEach((m) => days.set(m.date, (days.get(m.date) ?? 0) + m.items.reduce((a, i) => a + i.protein, 0)))
    return days.size ? Math.round([...days.values()].reduce((a, b) => a + b, 0) / days.size) : null
  }, [last7], null)
  const light = lightWeekActive(settings, today)

  const start = async (t: WorkoutTemplate) => nav(`/session/${await startSessionFromTemplate(t, byId, settings)}`)

  return (
    <main className="page">
      <header className="row between">
        <div>
          <h1>{greeting()}</h1>
          <p className="muted">יום {WEEKDAYS[weekday]}, {new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}</p>
        </div>
        <Link to="/settings" className="icon-btn" aria-label="הגדרות"><Settings size={22} /></Link>
      </header>

      {active ? (
        <div className="card stack">
          <div><div className="label">אימון בתהליך</div><h2>{active.name}</h2></div>
          <Link to={`/session/${active.id}`} className="btn btn-primary btn-lg"><Play size={20} />המשך אימון</Link>
        </div>
      ) : tpl ? (
        <div className="card stack">
          <div><div className="label">{planned ? 'האימון של היום' : 'האימון הבא'}</div><h2>{tpl.name}</h2>
            <p className="muted small">{tpl.items.map((i) => byId.get(i.exerciseId)?.nameHe).filter(Boolean).slice(0, 4).join(' · ')}{tpl.items.length > 4 ? ' ...' : ''}</p></div>
          <button className="btn btn-primary btn-lg" disabled={!tpl.items.length} onClick={() => start(tpl)}><Play size={20} />מוכן לאימון? התחל</button>
        </div>
      ) : (
        <div className="card empty"><h2>בוא נבנה אימון ראשון</h2><p className="muted">בחר תרגילים מהמאגר וקבע טווח חזרות.</p><Link to="/workouts" className="btn btn-primary">לאימונים</Link></div>
      )}

      {runToday && (
        <Link to="/running/plan" className="card stack">
          <div className="label">ריצה מתוכננת להיום</div><h2>{runToday}</h2>
        </Link>
      )}

      {settings.targets && (
        <Link to="/nutrition" className="card stack">
          <h2>תזונה היום</h2>
          <Progress label="קלוריות" value={eaten.kcal} target={settings.targets.calories} unit="קל׳" />
          <Progress label="חלבון" value={eaten.protein} target={settings.targets.protein} unit="ג׳" />
          {!settings.remindersOff && meals.length === 0 && new Date().getHours() >= 19 && <p className="muted small">עוד לא נרשם אוכל היום. אפשר להוסיף ארוחה במהירות.</p>}
        </Link>
      )}

      {!settings.remindersOff && deload?.suggest && (
        <div className="card stack">
          <h2>שבוע קל?</h2>
          <p className="muted">{deload.reason}. שבוע עם פחות נפח ופחות עומס עוזר להתאושש.</p>
          <div className="row">
            <button className="btn btn-primary grow" onClick={() => db.settings.update('main', { lastDeload: today })}>מקבל, מתחיל מחר</button>
            <button className="btn grow" onClick={() => db.settings.update('main', { deloadSnoozeUntil: todayStr(new Date(Date.now() + 7 * 86_400_000)) })}>לא עכשיו</button>
          </div>
        </div>
      )}

      {light && <p className="notice">השבוע קל: ההצעות באימונים מופחתות בעומס ובסט אחד. לא צריך להוכיח כלום, ההתאוששות היא חלק מהתהליך.</p>}
      {insights[0] && <InsightCard insight={insights[0]} />}

      <section className="card stack">
        <h2>7 הימים האחרונים</h2>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div><div className="num">{week.length}</div><div className="label">אימונים</div></div>
          <div><div className="num">{week.reduce((a, s) => a + s.entries.reduce((b, e) => b + e.sets.filter((x) => x.kind !== 'warmup').length, 0), 0)}</div><div className="label">סטים</div></div>
          <div><div className="num">{Math.round(week.reduce((a, s) => a + sessionVolume(s), 0) / 1000 * 10) / 10}</div><div className="label">טון נפח</div></div>
          <div><div className="num">{weeklyKm(runs, todayStr())}</div><div className="label">ק״מ ריצה</div></div>
        </div>
        {proteinWeek !== null && <p className="label">ממוצע חלבון בימים שנרשמו: {proteinWeek} ג׳{settings.targets ? ` (יעד ${settings.targets.protein})` : ''}</p>}
        {streak >= 2 && <p className="label">{streak} שבועות ברצף שמגיעים ליעד של {goal} פעילויות בשבוע. שבוע אחד חלש לא שובר את הרצף.</p>}
      </section>

      {finished.length > 0 && (
        <section className="card stack">
          <h2>סטים לפי שריר</h2>
          <p className="label">טווח מקובל כ-10 עד 20 סטים בשבוע. זו הנחיה כללית ולא כלל קשיח.</p>
          <div className="divided">
            {TRACKED.map((m) => {
              const n = sets[m] ?? 0
              return (
                <div key={m} className="item">
                  <span className="grow">{m}</span><span className="num-sm">{n}</span>
                  <span className="label" style={{ width: 44, textAlign: 'end' }}>{n < 10 ? 'חסר' : n > 20 ? 'הרבה' : 'טוב'}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
