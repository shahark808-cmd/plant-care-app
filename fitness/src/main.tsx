import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { seedIfEmpty } from './lib/db'
import '@fontsource/heebo/400.css'
import '@fontsource/heebo/500.css'
import './index.css'

if (!import.meta.env.DEV) registerSW({ immediate: true })

seedIfEmpty().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
})
