import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import { useSettings } from './lib/hooks'

const ExercisesRoute = lazy(() => import('./routes/ExercisesRoute'))
const HistoryRoute = lazy(() => import('./routes/HistoryRoute'))
const SessionRoute = lazy(() => import('./routes/SessionRoute'))
const SettingsRoute = lazy(() => import('./routes/SettingsRoute'))
const NutritionProfileRoute = lazy(() => import('./routes/NutritionProfileRoute'))
const NutritionRoute = lazy(() => import('./routes/NutritionRoute'))
const RunPlanRoute = lazy(() => import('./routes/RunPlanRoute'))
const RunningRoute = lazy(() => import('./routes/RunningRoute'))
const TodayRoute = lazy(() => import('./routes/TodayRoute'))
const WeightRoute = lazy(() => import('./routes/WeightRoute'))
const WorkoutEditRoute = lazy(() => import('./routes/WorkoutEditRoute'))
const WorkoutsRoute = lazy(() => import('./routes/WorkoutsRoute'))

export default function App() {
  const { theme } = useSettings()
  useEffect(() => {
    if (theme === 'auto') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <Suspense fallback={<main className="page" aria-busy="true" />}>
    <Routes>
      <Route path="/session/:id" element={<SessionRoute />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<TodayRoute />} />
        <Route path="/workouts" element={<WorkoutsRoute />} />
        <Route path="/workouts/exercises" element={<ExercisesRoute />} />
        <Route path="/workouts/history" element={<HistoryRoute />} />
        <Route path="/workouts/:id" element={<WorkoutEditRoute />} />
        <Route path="/running" element={<RunningRoute />} />
        <Route path="/running/plan" element={<RunPlanRoute />} />
        <Route path="/nutrition" element={<NutritionRoute />} />
        <Route path="/nutrition/weight" element={<WeightRoute />} />
        <Route path="/nutrition/profile" element={<NutritionProfileRoute />} />
        <Route path="/settings" element={<SettingsRoute />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  )
}
