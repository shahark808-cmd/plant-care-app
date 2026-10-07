import Dexie, { type EntityTable } from 'dexie'
import type { Category, Expense } from './types'

export const db = new Dexie('budget-app') as Dexie & {
  categories: EntityTable<Category, 'id'>
  expenses: EntityTable<Expense, 'id'>
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
