import type { ReactNode } from 'react'

export default function Chip({
  children,
  active = false,
  onClick,
}: {
  children: ReactNode
  active?: boolean
  onClick?: () => void
}) {
  const base = 'inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors'
  const state = active
    ? 'bg-accent text-white'
    : 'bg-card border border-border text-ink hover:border-accent'

  if (!onClick) {
    return <span className={`${base} ${state}`}>{children}</span>
  }

  return (
    <button type="button" onClick={onClick} className={`${base} ${state}`}>
      {children}
    </button>
  )
}
