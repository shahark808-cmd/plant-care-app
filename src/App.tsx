import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import WelcomeRoute from './routes/WelcomeRoute'
import SeoulRoute from './routes/SeoulRoute'
import TodayRoute from './routes/TodayRoute'
import InfoRoute from './routes/InfoRoute'
import PlacesRoute from './routes/PlacesRoute'
import NavigateRoute from './routes/NavigateRoute'
import TranslateRoute from './routes/TranslateRoute'
import { getUserName } from './lib/storage'

function RootRedirect() {
  return <Navigate to={getUserName() ? '/today' : '/welcome'} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/welcome" element={<WelcomeRoute />} />
      <Route path="/seoul" element={<SeoulRoute />} />
      <Route
        path="/today"
        element={
          <AppShell>
            <TodayRoute />
          </AppShell>
        }
      />
      <Route
        path="/info"
        element={
          <AppShell>
            <InfoRoute />
          </AppShell>
        }
      />
      <Route
        path="/places"
        element={
          <AppShell>
            <PlacesRoute />
          </AppShell>
        }
      />
      <Route
        path="/navigate"
        element={
          <AppShell>
            <NavigateRoute />
          </AppShell>
        }
      />
      <Route
        path="/translate"
        element={
          <AppShell>
            <TranslateRoute />
          </AppShell>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
