import { useEffect, useMemo, useRef, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useProductionData } from '../../features/production/state/ProductionDataContext'
import { getProductionProcess } from '../../features/production/model/productionProcess'
import {
  formatLimaOperationalDate,
  formatOperationalPeriod,
  getLimaShiftLabel,
  getOperationalWeekContextByNumber,
} from '../../utils/operationalContext'
import { TRABUNDA_STORAGE_KEYS } from '../../storage/trabundaStorage'
import {
  formatLimaWeekday,
  getSectionLabel,
} from './navigationConfig'
import { type ColorTheme, getInitialColorTheme } from './themeConfig'

const colorThemeStorageKey = TRABUNDA_STORAGE_KEYS.colorTheme

export function useAdminShell() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [colorTheme, setColorTheme] = useState<ColorTheme>(getInitialColorTheme)
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine)
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
  const operationalWeekday = formatLimaWeekday(currentTime)
  const operationalShift = getLimaShiftLabel(currentTime)
  const ShiftIcon = operationalShift === 'Turno Día' ? Sun : Moon
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
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
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

  return {
    isMenuOpen,
    setIsMenuOpen,
    colorTheme,
    toggleColorTheme,
    isOffline,
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
  }
}
