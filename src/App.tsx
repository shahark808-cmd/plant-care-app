import { Navigate, Route, Routes } from 'react-router-dom'
import BottomNav from './components/layout/BottomNav'
import InstallPrompt from './components/layout/InstallPrompt'
import TodayRoute from './routes/TodayRoute'
import PlantsRoute from './routes/PlantsRoute'
import PlantDetailRoute from './routes/PlantDetailRoute'
import HistoryRoute from './routes/HistoryRoute'
import SettingsRoute from './routes/SettingsRoute'
import LoginRoute from './routes/LoginRoute'
import OnboardingRoute from './routes/OnboardingRoute'
import { useSession } from './hooks/useSession'
import { useHousehold } from './hooks/useHousehold'

function FullScreenMessage({ text }: { text: string }) {
  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <p className="text-stone-500 dark:text-stone-400">{text}</p>
    </div>
  )
}

function App() {
  const { session, loading: sessionLoading } = useSession()
  const { household, loading: householdLoading } = useHousehold()

  if (sessionLoading) {
    return <FullScreenMessage text="טוען..." />
  }

  if (!session) {
    return <LoginRoute />
  }

  if (householdLoading) {
    return <FullScreenMessage text="טוען..." />
  }

  if (!household) {
    return <OnboardingRoute />
  }

  return (
    <div className="min-h-full pb-16">
      <InstallPrompt />
      <Routes>
        <Route path="/" element={<TodayRoute />} />
        <Route path="/plants" element={<PlantsRoute />} />
        <Route path="/plants/:plantId" element={<PlantDetailRoute />} />
        <Route path="/history" element={<HistoryRoute />} />
        <Route path="/settings" element={<SettingsRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default App
