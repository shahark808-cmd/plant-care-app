import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Expense } from '../types'
import ExpenseForm from '../components/ExpenseForm'
import ExpenseRow from '../components/ExpenseRow'
import MonthNav from '../components/MonthNav'
import Sheet from '../components/Sheet'
import { formatMoney, monthKey, monthRange } from '../lib/format'

export default function Expenses() {
  const [month, setMonth] = useState(monthKey())
  const [filter, setFilter] = useState<number | 'all'>('all')
  const [editing, setEditing] = useState<Expense | null>(null)

  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const expenses = useLiveQuery(() => {
    const [a, b] = monthRange(month)
    return db.expenses.where('date').between(a, b, true, true).toArray()
  }, [month])

  if (!categories || !expenses) return null
  const byId = new Map(categories.map((c) => [c.id, c]))
  const shown = expenses
    .filter((e) => filter === 'all' || e.categoryId === filter)
    .sort((x, y) => y.date.localeCompare(x.date) || (y.id ?? 0) - (x.id ?? 0))
  const total = shown.reduce((s, e) => s + e.amount, 0)

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-bold">הוצאות</h1>
      <MonthNav value={month} onChange={setMonth} />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {[{ id: 'all' as const, name: 'הכל' }, ...categories.map((c) => ({ id: c.id!, name: c.name }))].map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${
              filter === c.id ? 'border-accent bg-accent font-semibold text-on-accent' : 'border-line bg-surface'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex justify-between text-sm text-muted">
        <span>{shown.length} הוצאות</span>
        <span className="font-bold text-ink" dir="ltr">{formatMoney(total)}</span>
      </div>

      {shown.length === 0 ? (
        <p className="py-10 text-center text-muted">אין הוצאות בחודש הזה</p>
      ) : (
        <div className="rounded-2xl border border-line bg-surface px-4">
          {shown.map((e) => (
            <ExpenseRow key={e.id} expense={e} category={byId.get(e.categoryId)} onClick={() => setEditing(e)} />
          ))}
        </div>
      )}

      {editing && (
        <Sheet title="עריכת הוצאה" onClose={() => setEditing(null)}>
          <ExpenseForm
            categories={categories}
            initial={editing}
            submitLabel="שמור שינויים"
            onSubmit={async (v) => {
              await db.expenses.update(editing.id!, v)
              setEditing(null)
            }}
          />
          <button
            onClick={async () => {
              if (confirm('למחוק את ההוצאה?')) {
                await db.expenses.delete(editing.id!)
                setEditing(null)
              }
            }}
            className="mt-3 w-full rounded-2xl border border-bad py-3 font-semibold text-bad"
          >
            מחק הוצאה
          </button>
        </Sheet>
      )}
    </main>
  )
}
