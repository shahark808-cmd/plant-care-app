import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, deleteCategory } from '../db'
import type { Category } from '../types'
import MonthNav from '../components/MonthNav'
import Sheet from '../components/Sheet'
import { formatMoney, monthKey, monthRange, usageColor } from '../lib/format'

export default function Budget() {
  const [month, setMonth] = useState(monthKey())
  const [editing, setEditing] = useState<Category | 'new' | null>(null)

  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const expenses = useLiveQuery(() => {
    const [a, b] = monthRange(month)
    return db.expenses.where('date').between(a, b, true, true).toArray()
  }, [month])

  if (!categories || !expenses) return null
  const spent = new Map<number, number>()
  for (const e of expenses) spent.set(e.categoryId, (spent.get(e.categoryId) ?? 0) + e.amount)

  return (
    <main className="space-y-4">
      <h1 className="text-xl font-bold">תקציב חודשי</h1>
      <MonthNav value={month} onChange={setMonth} />

      <ul className="space-y-3">
        {categories.map((c) => {
          const used = spent.get(c.id!) ?? 0
          const pct = c.budget > 0 ? (used / c.budget) * 100 : 0
          const left = c.budget - used
          return (
            <li key={c.id}>
              <button onClick={() => setEditing(c)} className="w-full rounded-2xl border border-line bg-surface p-4 text-start">
                <div className="flex justify-between">
                  <span className="font-semibold">{c.name}</span>
                  <span className="text-sm" dir="ltr">
                    {formatMoney(used)}{c.budget > 0 && ` / ${formatMoney(c.budget)}`}
                  </span>
                </div>
                {c.budget > 0 ? (
                  <>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
                      <div className={`h-full rounded-full ${usageColor(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <div className="mt-1.5 text-xs text-muted">
                      {Math.round(pct)}% ·{' '}
                      {left >= 0 ? `נשארו ${formatMoney(left)}` : <span className="font-semibold text-bad">חריגה של {formatMoney(-left)}</span>}
                    </div>
                  </>
                ) : (
                  <div className="mt-1.5 text-xs text-muted">ללא מסגרת</div>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <button onClick={() => setEditing('new')} className="w-full rounded-2xl border border-dashed border-line py-3 font-semibold text-accent">
        + קטגוריה חדשה
      </button>

      {editing && (
        <CategorySheet
          category={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  )
}

function CategorySheet({ category, onClose }: { category?: Category; onClose: () => void }) {
  const [name, setName] = useState(category?.name ?? '')
  const [budget, setBudget] = useState(category ? String(category.budget || '') : '')
  const amount = Number(budget.replace(',', '.') || 0)
  const valid = name.trim() !== '' && Number.isFinite(amount) && amount >= 0

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    const data = { name: name.trim(), budget: amount }
    if (category) await db.categories.update(category.id!, data)
    else await db.categories.add(data)
    onClose()
  }

  async function remove() {
    if (!category?.id) return
    const n = await db.expenses.where('categoryId').equals(category.id).count()
    const msg = n > 0 ? `למחוק את "${category.name}"? ${n} הוצאות יועברו לקטגוריה "אחר".` : `למחוק את "${category.name}"?`
    if (confirm(msg)) {
      await deleteCategory(category.id)
      onClose()
    }
  }

  return (
    <Sheet title={category ? 'עריכת קטגוריה' : 'קטגוריה חדשה'} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <label className="block text-sm">
          שם
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2" />
        </label>
        <label className="block text-sm">
          מסגרת חודשית (₪, ריק = ללא מסגרת)
          <input value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="decimal" dir="ltr" className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-end" />
        </label>
        <button type="submit" disabled={!valid} className="w-full rounded-2xl bg-accent py-3 font-bold text-on-accent disabled:opacity-40">
          שמור
        </button>
        {category && !category.isFallback && (
          <button type="button" onClick={remove} className="w-full rounded-2xl border border-bad py-3 font-semibold text-bad">
            מחק קטגוריה
          </button>
        )}
      </form>
    </Sheet>
  )
}
