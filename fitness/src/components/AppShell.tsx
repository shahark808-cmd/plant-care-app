import { Dumbbell, Footprints, House, Salad } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'היום', icon: House, end: true },
  { to: '/workouts', label: 'אימונים', icon: Dumbbell },
  { to: '/running', label: 'ריצה', icon: Footprints },
  { to: '/nutrition', label: 'תזונה', icon: Salad },
]

export default function AppShell() {
  return (
    <>
      <Outlet />
      <nav className="nav" aria-label="ניווט ראשי">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon size={22} strokeWidth={1.6} aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
