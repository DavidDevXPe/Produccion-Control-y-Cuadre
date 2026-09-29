import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { Modal } from './components/ui/Modal'
import { ProductionDataProvider } from './features/production/state/ProductionDataContext'

function GlobalShortcuts() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        const key = event.key.toLowerCase()
        if (key === 'n') {
          event.preventDefault()
          router.navigate('/jornadas/nueva')
        } else if (key === 's') {
          event.preventDefault()
          router.navigate('/saldos')
        } else if (key === 'r') {
          event.preventDefault()
          router.navigate('/resumen')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return null
}

export function App() {
  return (
    <ProductionDataProvider>
      <GlobalShortcuts />
      <RouterProvider router={router} />
    </ProductionDataProvider>
  )
}

export default App
