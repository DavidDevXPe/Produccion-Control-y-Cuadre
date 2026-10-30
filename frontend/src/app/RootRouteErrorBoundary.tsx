import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import {
  isRouteErrorResponse,
  useRevalidator,
  useRouteError,
} from 'react-router-dom'
import { BrandLogo } from '../components/ui/BrandLogo'

export function RootRouteErrorBoundary() {
  const error = useRouteError()
  const revalidator = useRevalidator()
  const isRetrying = revalidator.state === 'loading'
  const isRouteResponse = isRouteErrorResponse(error)
  const message = getRootRouteErrorMessage(error)

  const handleRetry = () => {
    if (isRetrying) return
    if (isRouteResponse) {
      revalidator.revalidate()
      return
    }

    // A non-response error can be a failed lazy import. A full reload retries
    // that module without creating an automatic navigation loop.
    window.location.reload()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ui-surface-dark-deep px-4 py-8 text-ui-text-dark-strong sm:px-6">
      <section
        aria-labelledby="root-route-error-title"
        aria-describedby="root-route-error-description"
        className="w-full max-w-[39rem] rounded-2xl border border-ui-line-dark bg-ui-surface-dark p-7 shadow-2xl sm:p-8"
      >
        <div className="mb-5 flex justify-start">
          <BrandLogo compact />
        </div>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div
            aria-hidden="true"
            className="grid size-12 shrink-0 place-items-center rounded-xl border border-ui-amber-border-dark bg-ui-amber-surface-dark-deep text-ui-amber-text-dark"
          >
            <AlertTriangle className="size-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-ui-text-dark-brand">
              Control y cuadre operativo
            </p>
            <h1 id="root-route-error-title" className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
              No pudimos cargar esta pantalla
            </h1>
            <p id="root-route-error-description" role="alert" className="mt-3 max-w-lg text-sm leading-6 text-ui-text-dark-info">
              {message}
            </p>
            <p className="mt-2 text-xs leading-5 text-ui-text-dark-soft">
              Si el problema persiste, contacta al administrador del sistema.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                aria-busy={isRetrying}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-ui-brand px-4 py-2 text-sm font-bold text-ui-text-on-brand transition-colors hover:bg-ui-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-ui-surface-dark disabled:cursor-wait disabled:opacity-65"
              >
                <RefreshCw className={`size-4 ${isRetrying ? 'animate-spin' : ''}`} aria-hidden="true" />
                {isRetrying ? 'Intentando nuevamente…' : 'Intentar nuevamente'}
              </button>
              <a
                href={import.meta.env.BASE_URL}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-ui-line-dark-soft bg-ui-surface-dark-hover px-4 py-2 text-sm font-bold text-ui-text-dark transition-colors hover:border-ui-accent-cyan hover:bg-ui-surface-dark-hover-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-ui-surface-dark"
              >
                <Home className="size-4" aria-hidden="true" />
                Ir al inicio
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function getRootRouteErrorMessage(error: unknown): string {
  if (!isRouteErrorResponse(error)) {
    return 'Se produjo un error inesperado. Puedes intentar cargar la pantalla nuevamente.'
  }

  if (error.status === 404) {
    return 'La pantalla solicitada no existe o ya no está disponible.'
  }

  if (error.status === 401 || error.status === 403) {
    return 'No tienes permisos para acceder a esta pantalla.'
  }

  if (error.status >= 500) {
    return 'El servicio no pudo responder. Intenta nuevamente en unos momentos.'
  }

  return 'No se pudo cargar esta sección. Intenta nuevamente.'
}
