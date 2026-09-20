import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

const tabs: { to: string; label: string; icon: ReactNode }[] = [
  {
    to: '/today',
    label: 'היום',
    icon: (
      <path d="M12 3l8 6v11a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1V9l8-6z" />
    ),
  },
  {
    to: '/places',
    label: 'המלצות',
    icon: (
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    ),
  },
  {
    to: '/navigate',
    label: 'ניווט',
    icon: <path d="M3 11l17-8-8 17-2-7-7-2z" />,
  },
  {
    to: '/translate',
    label: 'תרגום',
    icon: (
      <path d="M4 5h7M7.5 4v2c0 3.5-2 6.5-5 8M5 15c2.6-1 5-3.3 6-6M14 21l4-9 4 9M15.3 18h5.4" />
    ),
  },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-card/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
              isActive ? 'text-accent' : 'text-[#A39B92]'
            }`
          }
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {tab.icon}
          </svg>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
