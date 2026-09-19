import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Chip from '../components/common/Chip'
import CategoryTag from '../components/common/CategoryTag'
import { CATEGORIES, PLACES } from '../data/places'
import type { CategoryKey } from '../types'

type FilterKey = 'all' | CategoryKey

export default function PlacesRoute() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [filter, setFilter] = useState<FilterKey>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return PLACES.filter((place) => {
      const matchesFilter = filter === 'all' || place.category === filter
      const matchesQuery = !q || place.name.toLowerCase().includes(q)
      return matchesFilter && matchesQuery
    })
  }, [query, filter])

  return (
    <div className="px-5 pb-6 pt-8">
      <h1 className="text-2xl font-bold text-ink">המלצות</h1>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="חיפוש מקום..."
        className="mt-4 w-full rounded-2xl border border-border bg-card px-4 py-3 text-base text-ink placeholder:text-muted focus:border-accent focus:outline-none"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          הכל
        </Chip>
        {CATEGORIES.filter((c) => c.key !== 'view').map((c) => (
          <Chip key={c.key} active={filter === c.key} onClick={() => setFilter(c.key)}>
            {c.label}
          </Chip>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        {filtered.map((place) => (
          <div
            key={place.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3.5"
          >
            <p className="font-medium text-ink">{place.name}</p>
            <CategoryTag category={place.category} />
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="mt-6 text-center text-sm text-muted">לא נמצאו מקומות תואמים</p>
        )}
      </div>
    </div>
  )
}
