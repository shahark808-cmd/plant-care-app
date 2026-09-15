import { Route, Routes } from 'react-router-dom'
import BottomNav from './components/layout/BottomNav'
import InstallPrompt from './components/layout/InstallPrompt'
import TodayRoute from './routes/TodayRoute'
import PlantsRoute from './routes/PlantsRoute'
import PlantDetailRoute from './routes/PlantDetailRoute'
import HistoryRoute from './routes/HistoryRoute'
import SettingsRoute from './routes/SettingsRoute'
import LoginRoute from './routes/LoginRoute'
import OnboardingRoute from './routes/OnboardingRoute'

function App() {
  return (
    <div className="min-h-full pb-16">
      <InstallPrompt />
      <Routes>
        <Route path="/" element={<TodayRoute />} />
        <Route path="/plants" element={<PlantsRoute />} />
        <Route path="/plants/:plantId" element={<PlantDetailRoute />} />
        <Route path="/history" element={<HistoryRoute />} />
        <Route path="/settings" element={<SettingsRoute />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/join" element={<OnboardingRoute />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default App
