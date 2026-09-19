import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SeoulSkylineSvg from '../components/common/SeoulSkylineSvg'
import Chip from '../components/common/Chip'
import Accordion from '../components/common/Accordion'
import { DISTRICTS } from '../data/districts'
import { findPlace } from '../data/places'

const FACTS = ['9.7M תושבים', '한국어 קוריאנית', '₩ וון קוריאני']

export default function SeoulRoute() {
  const [openDistrict, setOpenDistrict] = useState<string | null>(DISTRICTS[0]?.id ?? null)
  const navigate = useNavigate()

  return (
    <div className="min-h-full bg-bg">
      <div
        className="relative flex h-[300px] flex-col justify-end overflow-hidden px-6 pb-8 animate-fade-in"
      >
        <div className="absolute inset-0">
          <SeoulSkylineSvg />
        </div>
        <div className="relative">
          <h1 className="text-[56px] font-bold leading-none text-white" style={{ fontFamily: 'var(--font-serif)' }}>
            סיאול
          </h1>
          <p className="mt-3 max-w-xs text-sm text-white/85">
            עיר של ניגודים - ארמונות קדומים לצד רחובות עתידניים
          </p>
        </div>
      </div>

      <div className="animate-fade-up rounded-t-3xl bg-bg px-5 pb-28 pt-6">
        <div className="flex flex-wrap gap-2">
          {FACTS.map((fact) => (
            <span key={fact} className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-ink">
              {fact}
            </span>
          ))}
        </div>

        <p className="mt-5 text-sm leading-relaxed text-muted">
          סיאול היא בירת דרום קוריאה - עיר ענקית שבה שכונות מודרניות וגורדי שחקים חיים לצד ארמונות
          מלכותיים בני מאות שנים וסמטאות היסטוריות. כל רובע כאן מרגיש כמו עיר קטנה בפני עצמה, עם
          אופי, קצב וטעמים משלו.
        </p>

        <h2 className="mt-8 mb-3 text-lg font-bold text-ink">רבעים באזור</h2>
        <div className="flex flex-col gap-3">
          {DISTRICTS.map((district) => (
            <Accordion
              key={district.id}
              id={district.id}
              isOpen={openDistrict === district.id}
              onToggle={(id) => setOpenDistrict((prev) => (prev === id ? null : id))}
              header={
                <span className="text-base font-semibold text-ink">
                  {district.nameHe} <span className="font-normal text-muted">· {district.nameEn}</span>
                </span>
              }
            >
              <ul className="mb-3 flex flex-col gap-1.5 text-sm leading-relaxed text-muted">
                {district.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="text-accent">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              {district.chipPlaceIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {district.chipPlaceIds.map((placeId) => {
                    const place = findPlace(placeId)
                    if (!place) return null
                    return (
                      <Chip key={placeId} onClick={() => navigate(`/places?q=${encodeURIComponent(place.name)}`)}>
                        {place.name}
                      </Chip>
                    )
                  })}
                </div>
              )}
            </Accordion>
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigate('/today')}
          className="mt-8 w-full rounded-full bg-accent px-6 py-3.5 text-base font-semibold text-white"
        >
          בואו נתחיל
        </button>
      </div>
    </div>
  )
}
