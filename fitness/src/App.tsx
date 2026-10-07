import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import { useSettings } from './lib/hooks'
import ExercisesRoute from './routes/ExercisesRoute'
import HistoryRoute from './routes/HistoryRoute'
import SessionRoute from './routes/SessionRoute'
import SettingsRoute from './routes/SettingsRoute'
import NutritionProfileRoute from './routes/NutritionProfileRoute'
import NutritionRoute from './routes/NutritionRoute'
import SoonRoute from './routes/SoonRoute'
import TodayRoute from './routes/TodayRoute'
import WeightRoute from './routes/WeightRoute'
import WorkoutEditRoute from './routes/WorkoutEditRoute'
import WorkoutsRoute from './routes/WorkoutsRoute'

export default function App() {
  const { theme } = useSettings()
  useEffect(() => {
    if (theme === 'auto') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <Routes>
      <Route path="/session/:id" element={<SessionRoute />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<TodayRoute />} />
        <Route path="/workouts" element={<WorkoutsRoute />} />
        <Route path="/workouts/exercises" element={<ExercisesRoute />} />
        <Route path="/workouts/history" element={<HistoryRoute />} />
        <Route path="/workouts/:id" element={<WorkoutEditRoute />} />
        <Route path="/running" element={<SoonRoute />} />
        <Route path="/nutrition" element={<NutritionRoute />} />
        <Route path="/nutrition/weight" element={<WeightRoute />} />
        <Route path="/nutrition/profile" element={<NutritionProfileRoute />} />
        <Route path="/settings" element={<SettingsRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
