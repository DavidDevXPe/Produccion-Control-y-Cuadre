import {
  createBrowserRouter,
  isRouteErrorResponse,
  useRouteError,
} from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { DashboardPage } from '../features/production/pages/DashboardPage'
import { NotFoundPage } from '../pages/NotFoundPage'

// This boundary is consumed by the data router through `errorElement`; it is
// intentionally colocated with the router configuration.
// eslint-disable-next-line react-refresh/only-export-components
function RootRouteErrorBoundary() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? error.status === 404
      ? 'No encontramos la página solicitada.'
      : 'No se pudo cargar esta sección.'
    : 'Ocurrió un error inesperado al mostrar esta página.'

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-slate-100">
      <section
        aria-labelledby="root-route-error-title"
        className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-6"
      >
        <h1 id="root-route-error-title" className="text-xl font-semibold">
          No pudimos mostrar esta página
        </h1>
        <p role="alert" className="mt-3 text-sm text-slate-300">
          {message}
        </p>
        <a
          href={import.meta.env.BASE_URL}
          className="mt-5 inline-block rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          Volver al inicio
        </a>
      </section>
    </main>
  )
}

/**
 * The Dashboard is the landing page and stays in the main bundle. The other
 * screens load on demand: the capture form, the charts and the reports are
 * large and most visits never open all of them.
 */
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AdminLayout />,
      errorElement: <RootRouteErrorBoundary />,
      hydrateFallbackElement: (
        <p role="status" className="p-6 text-sm text-slate-600">
          Cargando…
        </p>
      ),
      children: [
        { index: true, element: <DashboardPage /> },
        {
          path: 'jornadas',
          lazy: async () => ({
            Component: (
              await import('../features/production/pages/ProductionDaysPage')
            ).ProductionDaysPage,
          }),
        },
        {
          path: 'jornadas/nueva',
          lazy: async () => ({
            Component: (
              await import('../features/production/pages/ProductionEntryPage')
            ).ProductionEntryPage,
          }),
        },
        {
          path: 'jornadas/:date/editar',
          lazy: async () => ({
            Component: (
              await import('../features/production/pages/ProductionEntryPage')
            ).ProductionEntryPage,
          }),
        },
        {
          path: 'jornadas/:date',
          lazy: async () => ({
            Component: (
              await import('../features/production/pages/ProductionDayPage')
            ).ProductionDayPage,
          }),
        },
        {
          path: 'saldos',
          lazy: async () => ({
            Component: (await import('../features/production/pages/BalancesPage'))
              .BalancesPage,
          }),
        },
        {
          path: 'rendimiento',
          lazy: async () => ({
            Component: (
              await import('../features/performance/pages/OperationalPerformancePage')
            ).OperationalPerformancePage,
          }),
        },
        {
          path: 'resumen',
          lazy: async () => ({
            Component: (
              await import('../features/production/pages/WeeklySummaryPage')
            ).WeeklySummaryPage,
          }),
        },
        {
          path: 'datos',
          lazy: async () => ({
            Component: (
              await import('../features/settings/pages/DataBackupsPage')
            ).DataBackupsPage,
          }),
        },
        {
          path: 'catalogos',
          lazy: async () => ({
            Component: (
              await import('../features/catalogs/pages/CatalogsPage')
            ).CatalogsPage,
          }),
        },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
)
