import Dexie, { type EntityTable } from 'dexie'
import type { Category, Expense, Income, Recurring } from './types'
import { dateInMonth, monthKey, shiftMonth, todayStr } from './lib/format'

export const db = new Dexie('budget-app') as Dexie & {
  categories: EntityTable<Category, 'id'>
  expenses: EntityTable<Expense, 'id'>
  incomes: EntityTable<Income, 'id'>
  recurring: EntityTable<Recurring, 'id'>
}

db.version(1).stores({
  categories: '++id, name',
  expenses: '++id, date, categoryId',
})

const DEFAULTS: Category[] = [
  { name: 'מזון', budget: 2000 },
  { name: 'תחבורה', budget: 500 },
  { name: 'דיור', budget: 4000 },
  { name: 'בילויים', budget: 800 },
  { name: 'בריאות', budget: 400 },
  { name: 'קניות', budget: 700 },
  { name: 'אחר', budget: 300, isFallback: true },
]

db.version(2).stores({
  incomes: '++id, date',
  recurring: '++id',
})

db.on('populate', (tx) => {
  tx.table('categories').bulkAdd(DEFAULTS)
})

export function deleteCategory(id: number) {
  return db.transaction('rw', db.categories, db.expenses, async () => {
    const fallback = (await db.categories.toArray()).find((c) => c.isFallback)
    if (!fallback?.id || fallback.id === id) return
    await db.expenses.where('categoryId').equals(id).modify({ categoryId: fallback.id })
    await db.categories.delete(id)
  })
}

/** יוצר הוצאות/הכנסות מפריטים קבועים שהגיע יומם. בטוח להרצה חוזרת. */
export function generateRecurring() {
  const today = todayStr()
  return db.transaction('rw', db.recurring, db.expenses, db.incomes, async () => {
    const items = await db.recurring.filter((r) => r.active).toArray()
    for (const r of items) {
      let m = r.lastRun ? r.lastRun.slice(0, 7) : r.startMonth
      while (m <= monthKey(new Date())) {
        const date = dateInMonth(m, r.day)
        if (date <= today && (!r.lastRun || date > r.lastRun)) {
          if (r.kind === 'expense' && r.categoryId !== undefined) {
            await db.expenses.add({ amount: r.amount, categoryId: r.categoryId, date, note: r.name, recurringId: r.id })
          } else if (r.kind === 'income') {
            await db.incomes.add({ amount: r.amount, source: r.name, date, recurringId: r.id })
          }
        }
        m = shiftMonth(m, 1)
      }
      await db.recurring.update(r.id!, { lastRun: today })
    }
  })
}
