import type { Category, Expense } from '../types'
import { formatDate, formatMoney } from '../lib/format'

export default function ExpenseRow({ expense, category, onClick }: { expense: Expense; category?: Category; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 border-b border-line py-3 text-start last:border-0"
    >
      <div className="min-w-0">
        <div className="font-medium">{category?.name ?? 'ללא קטגוריה'}{expense.recurringId !== undefined && <span title="הוצאה קבועה" className="ms-1 text-xs text-muted">↻</span>}</div>
        <div className="truncate text-xs text-muted">
          {formatDate(expense.date)}
          {expense.note && ` · ${expense.note}`}
        </div>
      </div>
      <div className="shrink-0 font-bold" dir="ltr">{formatMoney(expense.amount)}</div>
    </button>
  )
}
