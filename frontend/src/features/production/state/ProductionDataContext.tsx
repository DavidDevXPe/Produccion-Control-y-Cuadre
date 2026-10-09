/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  getOperationalWeekContext,
  getOperationalWeekContextByNumber,
  getOperationalWeekContextForIsoDate,
  getOperationalWeekState,
  type OperationalWeekState,
} from '../../../utils/operationalContext'
import { WEEK_36_2026_SUBSEQUENT_BALANCE_LOTS } from '../data/week36'
import {
  getProductionProcess,
  productionDayKey,
} from '../model/productionProcess'
import type { ProductionDay, ProductionProcess } from '../model/types'
import { getWeekClosureBlockers } from '../model/weekLifecycle'
import {
  ACTIVE_PROCESS_STORAGE_KEY,
  ACTIVE_WEEK_STORAGE_KEY,
  DAYS_STORAGE_KEY,
  PERMANENT_DAY_KEYS,
  PERMANENT_PRODUCTION_DAYS,
  PERMANENT_WEEK_NUMBERS,
  SEEDED_WEEK_NUMBER,
  WEEK_CLOSURES_STORAGE_KEY,
} from './productionDataConstants'
import {
  buildWeekView,
  fallbackValue,
  getInitialActiveProcess,
  getInitialActiveWeek,
  getWeekProductionDays,
  loadStoredDays,
  loadStoredWeekClosures,
  resolveWeekClosure,
  sortDays,
} from './productionDataHelpers'
import type {
  OperationalCalendarDay,
  OperationalWeekView,
  ProductionDataValue,
  StoredWeekClosure,
  WeekClosureType,
} from './productionDataTypes'

export type {
  OperationalCalendarDay,
  OperationalWeekView,
  ProductionDataValue,
  StoredWeekClosure,
  WeekClosureType,
}

const ProductionDataContext = createContext<ProductionDataValue>(fallbackValue)

interface ProductionDataProviderProps {
  children: ReactNode
}

export function ProductionDataProvider({ children }: ProductionDataProviderProps) {
  const [userDays, setUserDays] = useState<readonly ProductionDay[]>(loadStoredDays)
  const [storedWeekClosures, setStoredWeekClosures] = useState<
    readonly StoredWeekClosure[]
  >(loadStoredWeekClosures)
  const [activeWeekNumber, setActiveWeekNumberState] =
    useState(getInitialActiveWeek)
  const [activeProcess, setActiveProcessState] = useState<ProductionProcess>(
    getInitialActiveProcess,
  )
  const [currentWeekNumber, setCurrentWeekNumber] = useState(
    () => getOperationalWeekContext(new Date()).number,
  )

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const nextCurrentWeekNumber = getOperationalWeekContext(new Date()).number
      setCurrentWeekNumber((current) =>
        current === nextCurrentWeekNumber ? current : nextCurrentWeekNumber,
      )
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [])

  const setActiveWeekNumber = useCallback((weekNumber: number) => {
    setActiveWeekNumberState(weekNumber)
    try {
      window.localStorage.setItem(ACTIVE_WEEK_STORAGE_KEY, String(weekNumber))
    } catch {
      // The selection remains available during this browser session.
    }
  }, [])

  const setActiveProcess = useCallback((process: ProductionProcess) => {
    setActiveProcessState(process)
    try {
      window.localStorage.setItem(ACTIVE_PROCESS_STORAGE_KEY, process)
    } catch {
      // The process remains selected during this browser session.
    }
  }, [])

  const getWeekState = useCallback((
    weekNumber: number,
    process: ProductionProcess = activeProcess,
  ): OperationalWeekState => {
    const week = getOperationalWeekContextByNumber(weekNumber)
    const productionDays = getWeekProductionDays(weekNumber, userDays, process)
    const closure = resolveWeekClosure(
      weekNumber,
      process,
      week.period,
      productionDays,
      storedWeekClosures,
    )

    return getOperationalWeekState(
      week,
      getOperationalWeekContextByNumber(currentWeekNumber),
      closure.closureType ? 'CLOSED' : 'OPEN',
    )
  }, [activeProcess, currentWeekNumber, storedWeekClosures, userDays])

  const getWeekView = useCallback((
    weekNumber: number,
    process: ProductionProcess = activeProcess,
  ): OperationalWeekView => buildWeekView(
    weekNumber,
    userDays,
    process,
    storedWeekClosures,
    getOperationalWeekContextByNumber(currentWeekNumber),
  ), [activeProcess, currentWeekNumber, storedWeekClosures, userDays])

  const closeWeekManually = useCallback((
    weekNumber: number,
    process: ProductionProcess = activeProcess,
  ) => {
    const state = getWeekState(weekNumber, process)
    if (state.isFuture) {
      throw new Error('Una semana futura no puede cerrarse.')
    }
    if (state.isClosed) return

    const blockers = getWeekClosureBlockers(
      getWeekProductionDays(weekNumber, userDays, process),
    )
    if (blockers.length > 0) {
      throw new Error(blockers[0]!.message)
    }

    const closure: StoredWeekClosure = {
      weekNumber,
      process,
      status: 'CLOSED',
      closureType: 'MANUAL',
      closedAt: new Date().toISOString(),
    }
    const next = [
      ...storedWeekClosures.filter(
        (item) =>
          item.weekNumber !== weekNumber || item.process !== process,
      ),
      closure,
    ]

    try {
      window.localStorage.setItem(
        WEEK_CLOSURES_STORAGE_KEY,
        JSON.stringify(next),
      )
    } catch {
      throw new Error('El navegador no permitió guardar el cierre semanal.')
    }

    setStoredWeekClosures(next)
  }, [activeProcess, getWeekState, storedWeekClosures, userDays])

  const deleteProductionDay = useCallback((
    date: string,
    process: ProductionProcess = activeProcess,
  ) => {
    const dayKey = productionDayKey(date, process)
    if (PERMANENT_DAY_KEYS.has(dayKey)) {
      throw new Error(
        'Esta jornada forma parte del historial permanente y no puede eliminarse.',
      )
    }

    const existingDay = userDays.find(
      (day) =>
        productionDayKey(day.date, getProductionProcess(day)) === dayKey,
    )
    if (existingDay?.status === 'CLOSED') {
      throw new Error('Una jornada cerrada no puede eliminarse.')
    }

    const next = userDays.filter(
      (day) =>
        productionDayKey(day.date, getProductionProcess(day)) !== dayKey,
    )

    try {
      window.localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(next))
    } catch {
      throw new Error('El navegador no permitió actualizar el almacenamiento local.')
    }

    setUserDays(next)
  }, [activeProcess, userDays])

  const upsertProductionDay = useCallback((
    productionDay: ProductionDay,
    options: {
      allowReplace?: boolean | undefined
      previousDate?: string | undefined
    } = {},
  ) => {
    const process = getProductionProcess(productionDay)
    const dayKey = productionDayKey(productionDay.date, process)
    if (PERMANENT_DAY_KEYS.has(dayKey)) {
      throw new Error(
        'Esta jornada cerrada forma parte del historial permanente y es de solo lectura.',
      )
    }

    const week = getOperationalWeekContextForIsoDate(productionDay.date)
    const weekState = getWeekState(week.number, process)
    if (!weekState.canCreate) {
      throw new Error(
        weekState.isClosed
          ? 'La semana está cerrada y es de solo lectura.'
          : 'Una semana futura no permite crear o modificar jornadas.',
      )
    }

    const existingDay = userDays.find(
      (day) =>
        productionDayKey(day.date, getProductionProcess(day)) === dayKey,
    )
    if (existingDay?.status === 'CLOSED') {
      throw new Error('Una jornada cerrada es de solo lectura y no puede modificarse.')
    }
    const isChangingDate =
      Boolean(options.previousDate) && options.previousDate !== productionDay.date
    if (existingDay && !options.allowReplace && !isChangingDate) {
      throw new Error(
        'Ya existe una jornada para esta fecha. Abre la jornada existente para continuar.',
      )
    }

    const previousDayKey = isChangingDate
      ? productionDayKey(options.previousDate!, process)
      : null

    const next = sortDays([
      ...userDays.filter((day) => {
        const currentKey = productionDayKey(day.date, getProductionProcess(day))
        return currentKey !== dayKey && (!previousDayKey || currentKey !== previousDayKey)
      }),
      { ...productionDay, process },
    ])

    try {
      window.localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(next))
    } catch {
      throw new Error('El navegador no permitió guardar la jornada localmente.')
    }

    setUserDays(next)
    setActiveWeekNumber(week.number)
    setActiveProcess(process)
  }, [getWeekState, setActiveProcess, setActiveWeekNumber, userDays])

  const value = useMemo<ProductionDataValue>(() => {
    const currentWeek = getOperationalWeekContextByNumber(currentWeekNumber)
    const selectedWeekState = Number.isSafeInteger(activeWeekNumber)
      ? getOperationalWeekState(
          getOperationalWeekContextByNumber(activeWeekNumber),
          currentWeek,
        )
      : null
    const effectiveActiveWeekNumber =
      Number.isSafeInteger(activeWeekNumber) &&
      activeWeekNumber >= SEEDED_WEEK_NUMBER &&
      selectedWeekState?.isFuture === false
        ? activeWeekNumber
        : currentWeek.number
    const sequentialWeekNumbers = Array.from(
      { length: Math.max(currentWeek.number - SEEDED_WEEK_NUMBER + 1, 0) },
      (_, index) => SEEDED_WEEK_NUMBER + index,
    )
    const availableWeekNumbers = [
      ...new Set([
        ...sequentialWeekNumbers,
        ...PERMANENT_WEEK_NUMBERS,
        effectiveActiveWeekNumber,
        ...userDays.map(
          (day) => getOperationalWeekContextForIsoDate(day.date).number,
        ),
      ]),
    ]
      .filter((weekNumber) => {
        const week = getOperationalWeekContextByNumber(weekNumber)
        return !getOperationalWeekState(week, currentWeek).isFuture
      })
      .sort((first, second) => {
        const firstStartDate = getOperationalWeekContextByNumber(first).period
          .startDate
        const secondStartDate = getOperationalWeekContextByNumber(second).period
          .startDate
        return secondStartDate.localeCompare(firstStartDate)
      })
    const allProductionDays = sortDays([
      ...PERMANENT_PRODUCTION_DAYS,
      ...userDays.filter(
        (day) =>
          !PERMANENT_DAY_KEYS.has(
            productionDayKey(day.date, getProductionProcess(day)),
          ),
      ),
    ])

    return {
      activeWeek: buildWeekView(
        effectiveActiveWeekNumber,
        userDays,
        activeProcess,
        storedWeekClosures,
        currentWeek,
      ),
      activeProcess,
      activeWeekNumber: effectiveActiveWeekNumber,
      availableWeekNumbers,
      allProductionDays,
      subsequentBalanceLots: WEEK_36_2026_SUBSEQUENT_BALANCE_LOTS,
      setActiveWeekNumber,
      setActiveProcess,
      getWeekState,
      getWeekView,
      closeWeekManually,
      findProductionDay: (date, process = activeProcess) =>
        allProductionDays.find(
          (day) =>
            day.date === date && getProductionProcess(day) === process,
        ),
      isUserManagedDay: (date, process = activeProcess) =>
        !PERMANENT_DAY_KEYS.has(productionDayKey(date, process)) &&
        userDays.some(
          (day) =>
            day.date === date && getProductionProcess(day) === process,
        ),
      upsertProductionDay,
      deleteProductionDay,
    }
  }, [
    activeWeekNumber,
    activeProcess,
    closeWeekManually,
    currentWeekNumber,
    deleteProductionDay,
    getWeekState,
    getWeekView,
    setActiveProcess,
    setActiveWeekNumber,
    storedWeekClosures,
    upsertProductionDay,
    userDays,
  ])

  return (
    <ProductionDataContext.Provider value={value}>
      {children}
    </ProductionDataContext.Provider>
  )
}

export function useProductionData(): ProductionDataValue {
  return useContext(ProductionDataContext)
}

