import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, generateRecurring } from '../db'
import type { Category, Recurring as RecurringT } from '../types'
import Sheet from '../components/Sheet'
import { formatMoney, monthKey, todayStr } from '../lib/format'

export default function Recurring() {
  const [editing, setEditing] = useState<RecurringT | 'new' | null>(null)
  const items = useLiveQuery(() => db.recurring.toArray(), [])
  const categories = useLiveQuery(() => db.categories.toArray(), [])
  if (!items || !categories) return null
  const byId = new Map(categories.map((c) => [c.id, c]))

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-bold">הוצאות והכנסות קבועות</h1>
      <p className="text-sm text-muted">נוספות אוטומטית בכל חודש ביום שנקבע (כשהאפליקציה נפתחת).</p>

      {items.length === 0 ? (
        <p className="py-6 text-center text-muted">עוד לא הגדרת פריטים קבועים</p>
      ) : (
        <ul className="space-y-2">
          {items.map((r) => (
            <li key={r.id}>
              <button onClick={() => setEditing(r)} className={`flex w-full items-center justify-between rounded-2xl border border-line bg-surface p-4 text-start ${r.active ? '' : 'opacity-50'}`}>
                <div>
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-muted">
                    ב-{r.day} לחודש · {r.kind === 'income' ? 'הכנסה' : byId.get(r.categoryId)?.name ?? 'הוצאה'}{!r.active && ' · מושהה'}
                  </div>
                </div>
                <div className={`font-bold ${r.kind === 'income' ? 'text-ok' : ''}`} dir="ltr">{formatMoney(r.amount)}</div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button onClick={() => setEditing('new')} className="w-full rounded-2xl border border-dashed border-line py-3 font-semibold text-accent">+ פריט קבוע חדש</button>

      {editing && <RecurringSheet item={editing === 'new' ? undefined : editing} categories={categories} onClose={() => setEditing(null)} />}
    </main>
  )
}

function RecurringSheet({ item, categories, onClose }: { item?: RecurringT; categories: Category[]; onClose: () => void }) {
  const [kind, setKind] = useState<RecurringT['kind']>(item?.kind ?? 'expense')
  const [name, setName] = useState(item?.name ?? '')
  const [amount, setAmount] = useState(item ? String(item.amount) : '')
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? categories[0]?.id)
  const [day, setDay] = useState(String(item?.day ?? 1))
  const [active, setActive] = useState(item?.active ?? true)

  const value = Number(amount.replace(',', '.'))
  const d = Number(day)
  const valid = name.trim() !== '' && Number.isFinite(value) && value > 0 && Number.isInteger(d) && d >= 1 && d <= 31 && (kind === 'income' || categoryId !== undefined)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    const data = {
      kind, name: name.trim(), amount: Math.round(value * 100) / 100, day: d, active,
      categoryId: kind === 'expense' ? categoryId : undefined,
    }
    if (item) {
      // חידוש אחרי השהיה לא ממלא חודשים שהוחמצו
      const resumed = active && !item.active
      await db.recurring.update(item.id!, { ...data, ...(resumed ? { lastRun: todayStr() } : {}) })
    } else {
      await db.recurring.add({ ...data, startMonth: monthKey() })
    }
    await generateRecurring()
    onClose()
  }

  return (
    <Sheet title={item ? 'עריכת פריט קבוע' : 'פריט קבוע חדש'} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <div className="flex gap-2">
          {([['expense', 'הוצאה'], ['income', 'הכנסה']] as const).map(([k, l]) => (
            <button type="button" key={k} onClick={() => setKind(k)} className={`flex-1 rounded-xl border py-2 ${kind === k ? 'border-accent bg-accent font-semibold text-on-accent' : 'border-line'}`}>{l}</button>
          ))}
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'expense' ? 'למשל: שכירות, נטפליקס' : 'למשל: משכורת'} aria-label="שם" className="w-full rounded-xl border border-line bg-bg px-3 py-2" />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="סכום ₪" aria-label="סכום" dir="ltr" className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-end" />
        {kind === 'expense' && (
          <select value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} aria-label="קטגוריה" className="w-full rounded-xl border border-line bg-bg px-3 py-2">
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <label className="flex items-center justify-between text-sm">
          יום בחודש (1-31)
          <input value={day} onChange={(e) => setDay(e.target.value)} inputMode="numeric" dir="ltr" className="w-20 rounded-xl border border-line bg-bg px-3 py-2 text-end" />
        </label>
        {item && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> פעיל
          </label>
        )}
        <button type="submit" disabled={!valid} className="w-full rounded-2xl bg-accent py-3 font-bold text-on-accent disabled:opacity-40">שמור</button>
        {item && (
          <button type="button" onClick={async () => { if (confirm('למחוק את הפריט הקבוע? פריטים שכבר נוצרו יישארו.')) { await db.recurring.delete(item.id!); onClose() } }} className="w-full rounded-2xl border border-bad py-3 font-semibold text-bad">מחק</button>
        )}
      </form>
    </Sheet>
  )
}
