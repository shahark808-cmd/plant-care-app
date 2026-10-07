import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Home from './routes/Home'
import Expenses from './routes/Expenses'
import Budget from './routes/Budget'
import Income from './routes/Income'
import Recurring from './routes/Recurring'
import { generateRecurring } from './db'
import { useTheme } from './lib/useTheme'

export default function App() {
  const { theme, setTheme } = useTheme()
  useEffect(() => {
    const run = () => void generateRecurring()
    run()
    const onVisible = () => document.visibilityState === 'visible' && run()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])
  const next = theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system'
  const icon = theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '🌓'
  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 pb-24 pt-[max(1rem,env(safe-area-inset-top))]">
      <button
        onClick={() => setTheme(next)}
        aria-label="מצב תצוגה: בהיר / כהה / אוטומטי"
        className="absolute end-4 top-4 z-10 size-9 rounded-full border border-line bg-surface text-base"
      >
        {icon}
      </button>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/income" element={<Income />} />
        <Route path="/recurring" element={<Recurring />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}
