import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Income as IncomeT } from '../types'
import MonthNav from '../components/MonthNav'
import Sheet from '../components/Sheet'
import { formatDate, formatMoney, monthKey, monthRange, todayStr } from '../lib/format'

export default function Income() {
  const [month, setMonth] = useState(monthKey())
  const [editing, setEditing] = useState<IncomeT | 'new' | null>(null)

  const incomes = useLiveQuery(() => {
    const [a, b] = monthRange(month)
    return db.incomes.where('date').between(a, b, true, true).toArray()
  }, [month])
  const expenses = useLiveQuery(() => {
    const [a, b] = monthRange(month)
    return db.expenses.where('date').between(a, b, true, true).toArray()
  }, [month])

  if (!incomes || !expenses) return null
  const inc = incomes.reduce((s, i) => s + i.amount, 0)
  const exp = expenses.reduce((s, e) => s + e.amount, 0)
  const balance = inc - exp
  const sorted = [...incomes].sort((x, y) => y.date.localeCompare(x.date) || (y.id ?? 0) - (x.id ?? 0))

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-bold">הכנסות ויתרה</h1>
      <MonthNav value={month} onChange={setMonth} />

      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="text-sm text-muted">יתרה חודשית</div>
        <div className={`text-3xl font-bold ${balance < 0 ? 'text-bad' : 'text-ok'}`} dir="ltr">{formatMoney(balance)}</div>
        <div className="mt-3 flex justify-between text-sm">
          <span>הכנסות: <b dir="ltr">{formatMoney(inc)}</b></span>
          <span>הוצאות: <b dir="ltr">{formatMoney(exp)}</b></span>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="py-6 text-center text-muted">אין הכנסות בחודש הזה</p>
      ) : (
        <div className="rounded-2xl border border-line bg-surface px-4">
          {sorted.map((i) => (
            <button key={i.id} onClick={() => setEditing(i)} className="flex w-full items-center justify-between border-b border-line py-3 text-start last:border-0">
              <div>
                <div className="font-medium">{i.source}{i.recurringId !== undefined && <span className="ms-1 text-xs text-muted">↻</span>}</div>
                <div className="text-xs text-muted">{formatDate(i.date)}</div>
              </div>
              <div className="font-bold text-ok" dir="ltr">{formatMoney(i.amount)}</div>
            </button>
          ))}
        </div>
      )}

      <button onClick={() => setEditing('new')} className="w-full rounded-2xl bg-accent py-3 font-bold text-on-accent">+ הוסף הכנסה</button>

      {editing && <IncomeSheet income={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
    </main>
  )
}

function IncomeSheet({ income, onClose }: { income?: IncomeT; onClose: () => void }) {
  const [amount, setAmount] = useState(income ? String(income.amount) : '')
  const [source, setSource] = useState(income?.source ?? 'משכורת')
  const [date, setDate] = useState(income?.date ?? todayStr())
  const value = Number(amount.replace(',', '.'))
  const valid = Number.isFinite(value) && value > 0 && source.trim() !== '' && date !== ''

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    const data = { amount: Math.round(value * 100) / 100, source: source.trim(), date }
    if (income) await db.incomes.update(income.id!, data)
    else await db.incomes.add(data)
    onClose()
  }

  return (
    <Sheet title={income ? 'עריכת הכנסה' : 'הכנסה חדשה'} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="סכום ₪" aria-label="סכום" dir="ltr" autoFocus className="w-full rounded-xl border border-line bg-bg px-3 py-2 text-end text-2xl font-bold" />
        <div className="flex gap-2">
          {['משכורת', 'הכנסה נוספת'].map((s) => (
            <button type="button" key={s} onClick={() => setSource(s)} className={`rounded-full border px-3 py-1.5 text-sm ${source === s ? 'border-accent bg-accent text-on-accent' : 'border-line'}`}>{s}</button>
          ))}
        </div>
        <input value={source} onChange={(e) => setSource(e.target.value)} aria-label="מקור" className="w-full rounded-xl border border-line bg-bg px-3 py-2" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="תאריך" className="w-full rounded-xl border border-line bg-bg px-3 py-2" />
        <button type="submit" disabled={!valid} className="w-full rounded-2xl bg-accent py-3 font-bold text-on-accent disabled:opacity-40">שמור</button>
        {income && (
          <button type="button" onClick={async () => { if (confirm('למחוק את ההכנסה?')) { await db.incomes.delete(income.id!); onClose() } }} className="w-full rounded-2xl border border-bad py-3 font-semibold text-bad">מחק הכנסה</button>
        )}
      </form>
    </Sheet>
  )
}
