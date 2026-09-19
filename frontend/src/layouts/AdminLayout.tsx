import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BarChart3,
  Activity,
  CalendarDays,
  Database,
  History,
  LayoutDashboard,
  Menu,
  Moon,
  PackageOpen,
  Settings,
  Sun,
  X,
  type LucideIcon,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { UserIdentity } from '../components/ui/UserIdentity'
import { WeekSelector } from '../components/ui/WeekSelector'
import { localUser } from '../config/localUser'
import { useProductionData } from '../features/production/state/ProductionDataContext'
import { getProductionProcess } from '../features/production/model/productionProcess'
import {
  formatLimaOperationalDate,
  formatOperationalPeriod,
  getOperationalWeekContextByNumber,
  getLimaShiftLabel,
} from '../utils/operationalContext'
import { TRABUNDA_STORAGE_KEYS } from '../storage/trabundaStorage'

const brandLogoUrl = `${import.meta.env.BASE_URL}brand/trabunda-logo-white.png`
const industrialBackgroundUrl = `${import.meta.env.BASE_URL}brand/trabunda-industrial-bg.png`

type ColorTheme = 'light' | 'dark'

const colorThemeStorageKey = TRABUNDA_STORAGE_KEYS.colorTheme

function getInitialColorTheme(): ColorTheme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

interface ThemeToggleProps {
  theme: ColorTheme
  onToggle: () => void
  className?: string
}

function ThemeToggle({ theme, onToggle, className = '' }: ThemeToggleProps) {
  const isDark = theme === 'dark'
  const nextThemeLabel = isDark ? 'claro' : 'oscuro'

  return (
    <button
      type="button"
      className={`grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 dark:hover:border-slate-300 dark:hover:bg-slate-100 dark:hover:text-slate-900 ${className}`}
      aria-label={`Cambiar a tema ${nextThemeLabel}`}
      aria-pressed={isDark}
      title={`Cambiar a tema ${nextThemeLabel}`}
      onClick={onToggle}
    >
      {isDark ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </button>
  )
}

type NavigationItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

type UpcomingNavigationItem = {
  label: string
  icon: LucideIcon
}

const primaryNavigation: readonly NavigationItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
  { label: 'Jornadas', to: '/jornadas', icon: CalendarDays },
  { label: 'Saldos', to: '/saldos', icon: PackageOpen },
  { label: 'Rendimiento', to: '/rendimiento', icon: Activity },
  { label: 'Resumen', to: '/resumen', icon: BarChart3 },
]

const administrationNavigation: readonly NavigationItem[] = [
  { label: 'Datos', to: '/datos', icon: Database },
]

const upcomingNavigation: readonly UpcomingNavigationItem[] = [
  { label: 'Catálogos', icon: Settings },
  { label: 'Auditoría', icon: History },
]

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'group flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors dark:border-l-[3px]',
    isActive
      ? 'bg-brand-700 text-white dark:border-[#169fd0] dark:bg-[#12344a] dark:text-[#eef4f8] dark:[&>svg]:text-[#50b9dd]'
      : 'text-slate-300 hover:bg-white/6 hover:text-white dark:border-transparent dark:text-[#a4b4c3] dark:[&>svg]:text-[#6f8798] dark:hover:bg-[#101f2c] dark:hover:text-[#eef4f8] dark:hover:[&>svg]:text-[#94a9b8]',
  ].join(' ')

interface SidebarContentProps {
  onNavigate?: () => void
}

function SidebarContent({ onNavigate }: SidebarContentProps) {
  return (
    <div data-theme-sidebar className="flex h-full flex-col bg-brand-950 text-white dark:bg-[#07111d] dark:text-[#eef4f8]">
      <div className="h-[5.5rem] border-b border-white/10 px-4 py-2.5">
        <div data-theme-static="light" className="flex h-12 items-center justify-center overflow-hidden rounded-lg bg-white px-2">
          <img
            src={brandLogoUrl}
            alt="Trabunda Procesos Marinos"
            className="h-auto w-[12.75rem] max-w-none"
          />
        </div>
        <p className="mt-1 text-center text-[0.5625rem] font-semibold uppercase tracking-[0.13em] text-slate-500 dark:text-[#6f8798]">
          Producción · Control y cuadre
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <nav aria-label="Navegación principal">
          <p className="mb-2 px-3 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-[#6f8798]">
            Operación
          </p>
          <ul className="space-y-1">
            {primaryNavigation.map((item) => {
              const Icon = item.icon

              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end ?? false}
                    className={navLinkClassName}
                    onClick={() => onNavigate?.()}
                  >
                    <Icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <nav className="mt-7" aria-label="Módulos próximos">
          <p className="mb-2 px-3 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-[#6f8798]">
            Administración
          </p>
          <ul className="space-y-1">
            {administrationNavigation.map((item) => {
              const Icon = item.icon

              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={navLinkClassName}
                    onClick={() => onNavigate?.()}
                  >
                    <Icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              )
            })}
            {upcomingNavigation.map((item) => {
              const Icon = item.icon

              return (
                <li key={item.label}>
                  <button
                    type="button"
                    disabled
                    className="flex min-h-10 w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 dark:border-l-[3px] dark:border-transparent dark:text-[#526274]"
                    title="Disponible próximamente"
                  >
                    <Icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
                    <span className="flex-1">{item.label}</span>
                    <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-slate-500 dark:border-[#244052] dark:text-[#6f8798]">
                      Próximamente
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      <div className="h-[var(--sidebar-footer-height)] shrink-0 border-t border-white/10 px-5 py-3.5">
        <p className="text-[0.6875rem] font-semibold text-slate-400 dark:text-[#94a9b8]">
          Control y Cuadre Operativo
        </p>
        <p className="mt-0.5 text-[0.625rem] leading-4 text-slate-600 dark:text-[#6f8798]">
          Sistema interno de planta
        </p>
      </div>
    </div>
  )
}

function getSectionLabel(pathname: string) {
  const activeItem = primaryNavigation.find((item) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to),
  )

  return activeItem?.label ?? 'Control de producción'
}

export function AdminLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [colorTheme, setColorTheme] = useState<ColorTheme>(getInitialColorTheme)
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const mobileNavigationRef = useRef<HTMLElement>(null)
  const location = useLocation()
  const {
    activeWeek,
    activeWeekNumber,
    activeProcess,
    allProductionDays,
    availableWeekNumbers,
    getWeekState,
    setActiveWeekNumber,
  } = useProductionData()
  const isDashboard = location.pathname === '/'
  const sectionLabel = getSectionLabel(location.pathname)
  const operationalDate = formatLimaOperationalDate(currentTime)
  const operationalShift = getLimaShiftLabel(currentTime)
  const operationalPeriod = formatOperationalPeriod(activeWeek.period)
  const headerProcess = isDashboard ? 'PACKING' : activeProcess
  const weekSelectorOptions = useMemo(
    () =>
      availableWeekNumbers.map((weekNumber) => {
        const period = getOperationalWeekContextByNumber(weekNumber).period
        const hasRecords = allProductionDays.some(
          (day) =>
            getProductionProcess(day) === headerProcess &&
            day.date >= period.startDate &&
            day.date <= period.endDate,
        )
        const weekState = getWeekState(weekNumber, headerProcess)
        const recordCount = allProductionDays.filter(
          (day) =>
            getProductionProcess(day) === headerProcess &&
            day.date >= period.startDate &&
            day.date <= period.endDate,
        ).length

        return {
          number: weekNumber,
          year: Number(period.startDate.slice(0, 4)),
          startDate: period.startDate,
          endDate: period.endDate,
          periodLabel: formatOperationalPeriod(period),
          ...weekState,
          hasRecords,
          recordCount,
        }
      }),
    [allProductionDays, availableWeekNumbers, getWeekState, headerProcess],
  )

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(new Date()), 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const isDark = colorTheme === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.colorScheme = colorTheme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', isDark ? '#09121B' : '#123b4a')

    try {
      window.localStorage.setItem(colorThemeStorageKey, colorTheme)
    } catch {
      // La preferencia sigue activa durante la sesión si el navegador bloquea storage.
    }
  }, [colorTheme])

  const toggleColorTheme = () => {
    setColorTheme((current) => (current === 'light' ? 'dark' : 'light'))
  }

  useEffect(() => {
    if (!isMenuOpen) return

    const previouslyFocusedElement = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleDrawerKeyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = Array.from(
        mobileNavigationRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      )

      const firstElement = focusableElements.at(0)
      const lastElement = focusableElements.at(-1)

      if (!firstElement || !lastElement) return

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleDrawerKeyboard)

    return () => {
      document.removeEventListener('keydown', handleDrawerKeyboard)
      document.body.style.overflow = previousOverflow
      previouslyFocusedElement?.focus()
    }
  }, [isMenuOpen])

  return (
    <div className="min-h-dvh bg-shell text-slate-950">
      <a
        href="#contenido-principal"
        className="fixed left-4 top-3 z-[70] -translate-y-24 rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-lg focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        Saltar al contenido principal
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-transparent dark:border-[#1b3444] xl:block">
        <SidebarContent />
      </aside>

      <header className="theme-surface-translucent sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur xl:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50"
            aria-label="Abrir menú de navegación"
            aria-controls="mobile-navigation"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <div data-theme-static="light" className="flex h-10 w-28 shrink-0 items-center justify-center overflow-hidden bg-white">
            <img
              src={brandLogoUrl}
              alt="Trabunda Procesos Marinos"
              className="h-auto w-28 max-w-none"
            />
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <p className="hidden min-w-0 truncate text-sm font-bold text-slate-900 sm:block">
            {sectionLabel}
          </p>
          <WeekSelector
            options={weekSelectorOptions}
            selectedWeekNumber={activeWeekNumber}
            onChange={setActiveWeekNumber}
            compact
          />
          <ThemeToggle theme={colorTheme} onToggle={toggleColorTheme} />
          <UserIdentity
            user={localUser}
            responsive
            className="hidden min-[380px]:flex"
          />
        </div>
      </header>

      {isMenuOpen ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            aria-label="Cerrar menú de navegación"
            tabIndex={-1}
            onClick={() => setIsMenuOpen(false)}
          />
          <aside
            ref={mobileNavigationRef}
            id="mobile-navigation"
            className="relative h-full w-[min(20rem,88vw)] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-navigation-title"
          >
            <h2 id="mobile-navigation-title" className="sr-only">
              Menú de navegación
            </h2>
            <button
              ref={closeButtonRef}
              type="button"
              className="absolute right-3 top-4 z-10 grid size-10 place-items-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Cerrar menú"
              onClick={() => setIsMenuOpen(false)}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
            <SidebarContent onNavigate={() => setIsMenuOpen(false)} />
          </aside>
        </div>
      ) : null}

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

        <div className={`${isDashboard ? 'dashboard-topbar' : 'theme-surface-translucent'} relative z-20 hidden h-14 items-center justify-between border-b border-slate-200 bg-white px-7 xl:flex 2xl:px-8`}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.13em] text-brand-800">
              TRABUNDA Producción
            </p>
            <p className="mt-0.5 text-[0.6875rem] font-medium text-slate-500">
              Control y cuadre operativo
            </p>
          </div>
          <div className="flex h-full items-center text-xs text-slate-600">
            <div className="flex h-12 items-center gap-2 border-r border-slate-200 px-4 dark:border-[#244052]">
              <CalendarDays className="size-4 text-brand-700" aria-hidden="true" />
              <span className="number-tabular font-bold text-slate-800">{operationalDate}</span>
            </div>
            <div className="flex h-12 items-center gap-2 border-r border-slate-200 px-4 dark:border-[#244052]">
              <Sun className="size-4 text-amber-600" aria-hidden="true" />
              <span className="font-bold text-slate-800">{operationalShift}</span>
            </div>
            <div className="flex h-12 flex-col justify-center border-r border-slate-200 px-4 dark:border-[#244052]">
              <WeekSelector
                options={weekSelectorOptions}
                selectedWeekNumber={activeWeekNumber}
                onChange={setActiveWeekNumber}
              />
              <p className="number-tabular mt-0.5 w-full text-center text-[0.625rem] font-semibold tracking-[0.04em] text-[#7f9bad] dark:text-slate-500">
                {operationalPeriod}
              </p>
            </div>
            <div className="flex h-12 items-center border-r border-slate-200 px-3 dark:border-[#244052]">
              <ThemeToggle theme={colorTheme} onToggle={toggleColorTheme} />
            </div>
            <UserIdentity user={localUser} className="h-12 pl-4" />
          </div>
        </div>

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
