import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Capture the install prompt as early as possible — Chrome fires it on first
// load (often before React mounts / before the user logs in), so listening only
// inside DashboardLayout misses it. Stash it globally and notify listeners.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  ;(window as unknown as { __deferredInstall?: Event }).__deferredInstall = e
  window.dispatchEvent(new Event('installavailable'))
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
