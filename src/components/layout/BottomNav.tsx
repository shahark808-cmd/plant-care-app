import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'היום', icon: '💧' },
  { to: '/plants', label: 'צמחים', icon: '🌿' },
  { to: '/history', label: 'היסטוריה', icon: '🕓' },
  { to: '/settings', label: 'הגדרות', icon: '⚙️' },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 flex border-t border-stone-200 bg-white/95 backdrop-blur dark:border-stone-800 dark:bg-stone-950/95"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
              isActive
                ? 'text-green-600 dark:text-green-400'
                : 'text-stone-500 dark:text-stone-400'
            }`
          }
        >
          <span className="text-lg" aria-hidden="true">
            {tab.icon}
          </span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
