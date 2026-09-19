import { useState } from 'react'
import { Link } from 'react-router-dom'
import CategoryTag from '../components/common/CategoryTag'
import { DEFAULT_ITINERARY } from '../data/itinerary'
import { getItineraryNotes, setItineraryNote } from '../lib/storage'

function ItineraryNote({ itemId, placeholder }: { itemId: string; placeholder: string }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(() => getItineraryNotes()[itemId] ?? '')

  function save() {
    setItineraryNote(itemId, value)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="mt-2">
        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          rows={2}
          className="w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="mt-1.5 block text-start text-sm text-muted underline decoration-dotted underline-offset-4"
    >
      {value || placeholder}
    </button>
  )
}

export default function TodayRoute() {
  return (
    <div className="px-5 pb-6 pt-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">היום בטיול</h1>
          <p className="mt-1 text-sm text-muted">יום 3 מתוך 7 · סיאול</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-ink">
          24° בהיר
        </span>
      </div>

      <Link
        to="/info"
        className="mt-5 flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3.5"
      >
        <div>
          <p className="text-sm font-semibold text-ink">מידע חשוב</p>
          <p className="mt-0.5 text-xs text-muted">תחבורה, שפה, כסף ונימוסים</p>
        </div>
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted">
          <path d="M7.5 5l5 5-5 5" />
        </svg>
      </Link>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-bold text-ink">התוכנית של היום</h2>
        <button type="button" className="text-sm font-medium text-accent">
          עריכה
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {DEFAULT_ITINERARY.map((item) => (
          <div key={item.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="w-12 shrink-0 text-sm font-semibold text-accent">{item.time}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-ink">{item.place}</p>
                  <CategoryTag category={item.category} />
                </div>
                {item.placeKo && <p className="mt-0.5 text-xs text-muted">{item.placeKo}</p>}
                <ItineraryNote itemId={item.id} placeholder={item.notePlaceholder} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
