import { RefreshCw, Wifi, WifiOff, X } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { AdminHeader } from './shell/AdminHeader'
import { AdminMobileDrawer } from './shell/AdminMobileDrawer'
import { AdminMobileHeader } from './shell/AdminMobileHeader'
import { AdminSidebar } from './shell/AdminSidebar'
import { industrialBackgroundUrl } from './shell/navigationConfig'
import { useAdminShell } from './shell/useAdminShell'

export function AdminLayout() {
  const {
    isMenuOpen,
    setIsMenuOpen,
    colorTheme,
    toggleColorTheme,
    isOffline,
    showReconnected,
    externalDataChange,
    dismissExternalDataChange,
    closeButtonRef,
    mobileNavigationRef,
    isDashboard,
    sectionLabel,
    operationalDate,
    operationalWeekday,
    operationalShift,
    ShiftIcon,
    operationalPeriod,
    weekSelectorOptions,
    activeWeekNumber,
    setActiveWeekNumber,
  } = useAdminShell()

  return (
    <div className="min-h-dvh bg-shell text-slate-950">
      <a
        href="#contenido-principal"
        className="fixed left-4 top-3 z-[70] -translate-y-24 rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-lg focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        Saltar al contenido principal
      </a>

      <AdminSidebar />

      <AdminMobileHeader
        isMenuOpen={isMenuOpen}
        onOpenMenu={() => setIsMenuOpen(true)}
        sectionLabel={sectionLabel}
        weekSelectorOptions={weekSelectorOptions}
        activeWeekNumber={activeWeekNumber}
        onSelectWeek={setActiveWeekNumber}
        colorTheme={colorTheme}
        onToggleTheme={toggleColorTheme}
      />

      <AdminMobileDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        closeButtonRef={closeButtonRef}
        mobileNavigationRef={mobileNavigationRef}
      />

      <div className="relative min-w-0 xl:pl-64">
        {isDashboard ? (
          <div
            className="dashboard-layout-backdrop pointer-events-none absolute inset-x-0 top-0 z-0 hidden h-[12.5rem] overflow-hidden xl:left-64 xl:block"
            aria-hidden="true"
          >
            <img src={industrialBackgroundUrl} alt="" />
            <span />
          </div>
        ) : null}

        <AdminHeader
          isDashboard={isDashboard}
          operationalDate={operationalDate}
          operationalWeekday={operationalWeekday}
          operationalShift={operationalShift}
          ShiftIcon={ShiftIcon}
          weekSelectorOptions={weekSelectorOptions}
          activeWeekNumber={activeWeekNumber}
          onSelectWeek={setActiveWeekNumber}
          operationalPeriod={operationalPeriod}
          colorTheme={colorTheme}
          onToggleTheme={toggleColorTheme}
        />

        {isOffline ? (
          <div
            role="status"
            aria-live="polite"
            className="relative z-20 flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/15 px-4 py-2 text-center text-xs font-semibold text-amber-800 dark:text-amber-200"
          >
            <WifiOff className="size-4 shrink-0" aria-hidden="true" />
            <span>
              Modo Sin Conexión (PWA activo): Los datos se guardan localmente en el navegador.
            </span>
          </div>
        ) : showReconnected ? (
          <div
            role="status"
            aria-live="polite"
            className="relative z-20 flex items-center justify-center gap-2 border-b border-emerald-500/30 bg-emerald-500/15 px-4 py-2 text-center text-xs font-semibold text-emerald-800 dark:text-emerald-200"
          >
            <Wifi className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>
              Conexión restablecida: trabajando en línea con almacenamiento sincronizado.
            </span>
          </div>
        ) : null}

        {externalDataChange ? (
          <div
            role="status"
            aria-live="polite"
            className="relative z-20 flex items-center justify-center gap-2 border-b border-sky-500/30 bg-sky-500/10 px-4 py-2 text-center text-xs font-semibold text-sky-800 dark:text-sky-200"
          >
            <RefreshCw className="size-4 shrink-0" aria-hidden="true" />
            <span>
              Se actualizaron datos desde otra pestaña. Si estabas editando una jornada, revísala antes de guardar.
            </span>
            <button
              type="button"
              onClick={dismissExternalDataChange}
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-sky-900 underline-offset-2 transition hover:bg-sky-500/15 hover:underline focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 focus:ring-offset-sky-100 dark:text-sky-100 dark:focus:ring-offset-slate-950"
              aria-label="Cerrar aviso de actualización externa"
            >
              Entendido
              <X className="size-3" aria-hidden="true" />
            </button>
          </div>
        ) : null}

        <main
          id="contenido-principal"
          tabIndex={-1}
          className="relative z-10 mx-auto w-full min-w-0 max-w-[92.5rem] px-4 py-5 focus:outline-none sm:px-5 lg:px-6 lg:py-6 xl:px-7 2xl:px-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
