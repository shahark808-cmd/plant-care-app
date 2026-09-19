import { useState } from 'react'
import { kakaoMapUrl, naverMapUrl } from '../lib/mapLinks'
import { SAVED_PLACES } from '../data/phrases'

function MapButton({
  label,
  letter,
  bg,
  text,
  href,
}: {
  label: string
  letter: string
  bg: string
  text: string
  href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex flex-1 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
        style={{ backgroundColor: bg, color: text }}
      >
        {letter}
      </span>
      <span className="font-semibold text-ink">{label}</span>
    </a>
  )
}

export default function NavigateRoute() {
  const [query, setQuery] = useState('')

  return (
    <div className="px-5 pb-6 pt-8">
      <h1 className="text-2xl font-bold text-ink">ניווט</h1>

      <div className="mt-4 flex gap-3">
        <MapButton label="Naver Map" letter="N" bg="#03C75A" text="#ffffff" href={naverMapUrl()} />
        <MapButton label="Kakao Map" letter="K" bg="#FEE500" text="#201C1A" href={kakaoMapUrl()} />
      </div>

      <div className="mt-5 flex items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="לאן?"
          className="min-w-0 flex-1 rounded-2xl border border-border bg-card px-4 py-3 text-base text-ink placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <a
          href={naverMapUrl(query)}
          target="_blank"
          rel="noreferrer"
          aria-label="חיפוש בנייבר מפות"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: '#03C75A' }}
        >
          N
        </a>
        <a
          href={kakaoMapUrl(query)}
          target="_blank"
          rel="noreferrer"
          aria-label="חיפוש בקקאו מפות"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{ backgroundColor: '#FEE500', color: '#201C1A' }}
        >
          K
        </a>
      </div>

      <h2 className="mt-8 mb-3 text-lg font-bold text-ink">מקומות שמורים</h2>
      <div className="flex flex-col gap-2.5">
        {SAVED_PLACES.map((place) => (
          <div key={place.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
            <div>
              <p className="font-medium text-ink">{place.name}</p>
              <p className="mt-0.5 text-xs text-muted">{place.detail}</p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <a
                href={naverMapUrl(place.name)}
                target="_blank"
                rel="noreferrer"
                aria-label={`נווט ל${place.name} בנייבר`}
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: '#03C75A' }}
              >
                N
              </a>
              <a
                href={kakaoMapUrl(place.name)}
                target="_blank"
                rel="noreferrer"
                aria-label={`נווט ל${place.name} בקקאו`}
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                style={{ backgroundColor: '#FEE500', color: '#201C1A' }}
              >
                K
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-4">
        <p className="text-sm font-semibold text-ink">כרטיס T-money</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          קונים ב-CU/GS25 או בתחנה, טוענים מזומן, עובד על אוטובוס/מטרו/מוניות.
        </p>
      </div>
    </div>
  )
}
