import { useMemo, useState } from 'react'
import Accordion from '../components/common/Accordion'
import { INFO_CATEGORIES } from '../data/info'

type SortMode = 'importance' | 'alpha'

export default function InfoRoute() {
  const [sortMode, setSortMode] = useState<SortMode>('importance')
  const [openId, setOpenId] = useState<string | null>(INFO_CATEGORIES[0]?.id ?? null)

  const sorted = useMemo(() => {
    const list = [...INFO_CATEGORIES]
    if (sortMode === 'alpha') {
      list.sort((a, b) => a.title.localeCompare(b.title, 'he'))
    } else {
      list.sort((a, b) => a.importance - b.importance)
    }
    return list
  }, [sortMode])

  return (
    <div className="px-5 pb-6 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">מידע חשוב</h1>
        <button
          type="button"
          onClick={() => setSortMode((m) => (m === 'importance' ? 'alpha' : 'importance'))}
          className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-ink"
        >
          {sortMode === 'importance' ? 'לפי חשיבות' : 'א\'-ב\''}
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {sorted.map((category) => (
          <Accordion
            key={category.id}
            id={category.id}
            isOpen={openId === category.id}
            onToggle={(id) => setOpenId((prev) => (prev === id ? null : id))}
            header={<span className="text-base font-semibold text-ink">{category.title}</span>}
          >
            <dl className="flex flex-col gap-3">
              {category.items.map((item) => (
                <div key={item.title}>
                  <dt className="text-sm font-semibold text-ink">{item.title}</dt>
                  <dd className="mt-0.5 text-sm leading-relaxed text-muted">{item.description}</dd>
                </div>
              ))}
            </dl>
          </Accordion>
        ))}
      </div>
    </div>
  )
}
