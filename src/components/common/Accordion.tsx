import type { ReactNode } from 'react'

export default function Accordion({
  id,
  isOpen,
  onToggle,
  header,
  children,
}: {
  id: string
  isOpen: boolean
  onToggle: (id: string) => void
  header: ReactNode
  children: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start"
        aria-expanded={isOpen}
      >
        {header}
        <svg
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${isOpen ? '-rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 7.5l5 5 5-5" />
        </svg>
      </button>
      {isOpen && <div className="border-t border-border px-4 py-3.5">{children}</div>}
    </div>
  )
}
