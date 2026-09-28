import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { Modal } from './components/ui/Modal'
import { ProductionDataProvider } from './features/production/state/ProductionDataContext'

function GlobalShortcuts() {
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcut keypresses inside input or textarea
      const targetTag = (event.target as HTMLElement)?.tagName
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') {
        return
      }

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
        } else if (key === 'h') {
          event.preventDefault()
          setShowHelp((prev) => !prev)
        }
      } else if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault()
        setShowHelp((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!showHelp) return null

  return (
    <Modal
      titleId="shortcuts-help-title"
      onClose={() => setShowHelp(false)}
    >
      <div className="space-y-4 p-6 text-sm text-slate-700 dark:text-slate-200">
        <h2 id="shortcuts-help-title" className="text-lg font-bold text-slate-900 dark:text-white">
          Atajos de teclado del sistema
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Usa estas combinaciones de teclas desde cualquier pantalla para navegar rápidamente.
        </p>

        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          <li className="flex items-center justify-between py-2">
            <span className="font-medium">Nueva jornada de producción</span>
            <kbd className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Alt + N
            </kbd>
          </li>
          <li className="flex items-center justify-between py-2">
            <span className="font-medium">Saldos pendientes</span>
            <kbd className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Alt + S
            </kbd>
          </li>
          <li className="flex items-center justify-between py-2">
            <span className="font-medium">Resumen semanal</span>
            <kbd className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Alt + R
            </kbd>
          </li>
          <li className="flex items-center justify-between py-2">
            <span className="font-medium">Abrir esta ayuda de teclado</span>
            <kbd className="rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-mono font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              ? / Alt + H
            </kbd>
          </li>
        </ul>

        <div className="pt-2 text-right">
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-brand-700"
          >
            Entendido
          </button>
        </div>
      </div>
    </Modal>
  )
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

