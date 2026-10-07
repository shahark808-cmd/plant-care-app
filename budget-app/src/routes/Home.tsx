import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import ExpenseForm from '../components/ExpenseForm'
import ExpenseRow from '../components/ExpenseRow'

export default function Home() {
  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const recent = useLiveQuery(() => db.expenses.orderBy('id').reverse().limit(5).toArray(), [])
  const [toast, setToast] = useState(false)

  if (!categories) return null
  const byId = new Map(categories.map((c) => [c.id, c]))

  return (
    <main className="space-y-6">
      <h1 className="text-xl font-bold">הוצאה חדשה</h1>
      <ExpenseForm
        categories={categories}
        submitLabel="הוסף הוצאה"
        autoFocus
        onSubmit={async (v) => {
          await db.expenses.add(v)
          setToast(true)
          setTimeout(() => setToast(false), 1500)
        }}
      />
      <p role="status" className={`text-center text-sm font-semibold text-ok transition-opacity ${toast ? 'opacity-100' : 'opacity-0'}`}>
        ✓ ההוצאה נוספה
      </p>
      {recent && recent.length > 0 && (
        <section>
          <h2 className="mb-1 text-sm font-semibold text-muted">נוספו לאחרונה</h2>
          <div className="rounded-2xl border border-line bg-surface px-4">
            {recent.map((e) => (
              <ExpenseRow key={e.id} expense={e} category={byId.get(e.categoryId)} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
