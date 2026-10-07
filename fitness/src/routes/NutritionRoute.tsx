import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronRight, Plus, Trash2, BookmarkPlus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import InsightCard from '../components/InsightCard'
import { useInsights } from '../lib/useInsights'
import AddFoodSheet from '../components/AddFoodSheet'
import { db, todayStr, uid } from '../lib/db'
import { useSettings } from '../lib/hooks'
import { sumMacros } from '../lib/nutrition'
import type { MealItem, MealLog, MealType } from '../types'

export const MEAL_TYPES: { key: MealType; label: string }[] = [
  { key: 'breakfast', label: 'בוקר' }, { key: 'lunch', label: 'צהריים' }, { key: 'dinner', label: 'ערב' }, { key: 'snack', label: 'חטיפים' },
]

export function NutritionTabs({ active }: { active: 'day' | 'weight' | 'profile' }) {
  return (
    <div className="seg" role="tablist">
      <Link to="/nutrition" className={active === 'day' ? 'on' : ''}>היום</Link>
      <Link to="/nutrition/weight" className={active === 'weight' ? 'on' : ''}>משקל</Link>
      <Link to="/nutrition/profile" className={active === 'profile' ? 'on' : ''}>הנתונים שלי</Link>
    </div>
  )
}

const shift = (d: string, n: number) => todayStr(new Date(new Date(d + 'T12:00').getTime() + n * 86_400_000))

export function Progress({ label, value, target, unit }: { label: string; value: number; target?: number; unit: string }) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0
  return (
    <div className="stack" style={{ gap: 6 }}>
      <div className="row between"><span className="label">{label}</span>
        <span><span className="num-sm">{Math.round(value)}</span><span className="label">{target ? ` / ${Math.round(target)}` : ''} {unit}</span></span></div>
      <div className="bar" role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemax={target}><i style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

export default function NutritionRoute() {
  const [date, setDate] = useState(todayStr())
  const [adding, setAdding] = useState<MealType | null>(null)
  const { targets } = useSettings()
  const insight = useInsights('nutrition')[0]
  const meals = useLiveQuery(() => db.meals.where('date').equals(date).toArray(), [date], [] as MealLog[])
  const total = sumMacros(meals.flatMap((m) => m.items))
  const left = targets ? targets.calories - total.kcal : null

  const removeItem = async (m: MealLog, item: MealItem) => {
    const items = m.items.filter((i) => i.id !== item.id)
    await (items.length ? db.meals.put({ ...m, items }) : db.meals.delete(m.id))
  }
  const saveMeal = async (items: MealItem[]) => {
    const name = prompt('שם לארוחה השמורה')?.trim()
    if (name) await db.savedMeals.add({ id: uid(), name, items: items.map(({ id: _id, ...rest }) => rest) })
  }

  return (
    <main className="page">
      <h1>תזונה</h1>
      <NutritionTabs active="day" />
      <div className="row between">
        <button className="icon-btn" aria-label="היום הקודם" onClick={() => setDate(shift(date, -1))}><ChevronRight size={22} /></button>
        <strong>{date === todayStr() ? 'היום' : new Date(date + 'T12:00').toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}</strong>
        <button className="icon-btn" aria-label="היום הבא" disabled={date >= todayStr()} onClick={() => setDate(shift(date, 1))}><ChevronLeft size={22} /></button>
      </div>

      <section className="card stack">
        <div className="row between">
          <div><div className="num">{Math.round(total.kcal)}</div><div className="label">קלוריות{targets ? ` מתוך ${targets.calories}` : ''}</div></div>
          {left !== null && <div style={{ textAlign: 'end' }}><div className="num-sm" style={{ color: left < 0 ? 'var(--danger)' : undefined }}>{Math.abs(Math.round(left))}</div><div className="label">{left < 0 ? 'מעל היעד' : 'נשארו'}</div></div>}
        </div>
        <Progress label="חלבון" value={total.protein} target={targets?.protein} unit="ג׳" />
        <Progress label="פחמימות" value={total.carbs} target={targets?.carbs} unit="ג׳" />
        <Progress label="שומן" value={total.fat} target={targets?.fat} unit="ג׳" />
        {!targets && <p className="notice">כדי לראות יעדים, <Link to="/nutrition/profile" style={{ textDecoration: 'underline' }}>מלא את הנתונים שלך</Link>.</p>}
      </section>

      {insight && date === todayStr() && <InsightCard insight={insight} />}

      {MEAL_TYPES.map(({ key, label }) => {
        const mine = meals.filter((m) => m.type === key)
        const items = mine.flatMap((m) => m.items)
        return (
          <section key={key} className="card stack">
            <div className="row between"><h2>{label}</h2><span className="label">{Math.round(sumMacros(items).kcal)} קלוריות</span></div>
            {items.length > 0 && (
              <div className="divided">
                {mine.flatMap((m) => m.items.map((it) => (
                  <div key={it.id} className="item">
                    <div className="grow"><div>{it.name}{it.estimated ? ' (הערכה)' : ''}</div><div className="label">{it.amount} · {Math.round(it.kcal)} קל׳ · {Math.round(it.protein)} ג׳ חלבון</div></div>
                    <button className="icon-btn" aria-label={`הסר ${it.name}`} onClick={() => removeItem(m, it)}><Trash2 size={18} /></button>
                  </div>
                )))}
              </div>
            )}
            <div className="row">
              <button className="btn grow" onClick={() => setAdding(key)}><Plus size={18} />הוסף</button>
              {items.length > 1 && <button className="btn" aria-label="שמור כארוחה קבועה" onClick={() => saveMeal(items)}><BookmarkPlus size={18} /></button>}
            </div>
          </section>
        )
      })}
      {adding && <AddFoodSheet date={date} type={adding} onClose={() => setAdding(null)} />}
    </main>
  )
}
