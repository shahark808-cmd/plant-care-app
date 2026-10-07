import { useEffect, useRef, useState } from 'react'
import type { Category, Expense } from '../types'
import { todayStr } from '../lib/format'

export type ExpenseValues = Omit<Expense, 'id'>

interface Props {
  categories: Category[]
  initial?: Expense
  submitLabel: string
  autoFocus?: boolean
  onSubmit: (v: ExpenseValues) => void | Promise<void>
}

const LAST_CAT = 'lastCategory'
const lastCategory = () => {
  try { return Number(localStorage.getItem(LAST_CAT)) || undefined } catch { return undefined }
}

export default function ExpenseForm({ categories, initial, submitLabel, autoFocus, onSubmit }: Props) {
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [categoryId, setCategoryId] = useState<number | undefined>(initial?.categoryId ?? lastCategory())
  const [date, setDate] = useState(initial?.date ?? todayStr())
  const [note, setNote] = useState(initial?.note ?? '')
  const amountRef = useRef<HTMLInputElement>(null)

  // אם הקטגוריה השמורה כבר לא קיימת - נבחר את הראשונה
  const selected = categories.find((c) => c.id === categoryId)?.id ?? categories[0]?.id
  const value = Number(amount.replace(',', '.'))
  const valid = Number.isFinite(value) && value > 0 && selected !== undefined && date !== ''

  useEffect(() => {
    if (autoFocus) amountRef.current?.focus()
  }, [autoFocus])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || selected === undefined) return
    try { localStorage.setItem(LAST_CAT, String(selected)) } catch { /* ignore */ }
    await onSubmit({ amount: Math.round(value * 100) / 100, categoryId: selected, date, note: note.trim() })
    if (!initial) {
      setAmount('')
      setNote('')
      amountRef.current?.focus()
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3">
        <span className="text-2xl text-muted">₪</span>
        <input
          ref={amountRef}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="0"
          aria-label="סכום"
          dir="ltr"
          className="w-full bg-transparent text-end text-4xl font-bold outline-none placeholder:text-muted/50"
        />
      </div>

      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="קטגוריה">
        {categories.map((c) => (
          <button
            type="button"
            key={c.id}
            role="radio"
            aria-checked={c.id === selected}
            onClick={() => setCategoryId(c.id)}
            className={`rounded-full border px-4 py-2 text-sm ${
              c.id === selected ? 'border-accent bg-accent font-semibold text-on-accent' : 'border-line bg-surface'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="תאריך"
          className="w-40 rounded-xl border border-line bg-surface px-3 py-2"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="הערה (אופציונלי)"
          aria-label="הערה"
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={!valid}
        className="w-full rounded-2xl bg-accent py-3.5 text-lg font-bold text-on-accent disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </form>
  )
}
