import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'הוספה', icon: '＋' },
  { to: '/expenses', label: 'הוצאות', icon: '☰' },
  { to: '/budget', label: 'תקציב', icon: '◔' },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${isActive ? 'font-bold text-accent' : 'text-muted'}`
            }
          >
            <span className="text-xl leading-none">{t.icon}</span>
            {t.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
