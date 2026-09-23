import { createBrowserRouter } from 'react-router-dom'
import { AdminLayout } from '../layouts/AdminLayout'
import { DashboardPage } from '../features/production/pages/DashboardPage'
import { NotFoundPage } from '../pages/NotFoundPage'

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
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
)
