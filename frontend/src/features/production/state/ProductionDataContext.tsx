/* eslint-disable react-refresh/only-export-components */
import {
  useCallback,
  createContext,
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
  type OperationalWeekBusinessStatus,
  type OperationalWeekState,
  type OperationalWeekTemporalStatus,
} from '../../../utils/operationalContext'
import {
  TRABUNDA_LEGACY_STORAGE_KEYS,
  TRABUNDA_STORAGE_KEYS,
} from '../../../storage/trabundaStorage'
import {
  WEEK_36_2026_PRODUCTION_DAYS,
  WEEK_36_2026_SUBSEQUENT_BALANCE_LOTS,
} from '../data/week36'
import { MONDAY_WEEK_42_PRODUCTION_DAY } from '../data/mondayWeek42'
import type {
  BalanceLot,
  ProductionDay,
  ProductionProcess,
  WeeklySummaryPeriod,
} from '../model/types'
import {
  getProductionProcess,
  isProductionProcess,
  productionDayKey,
} from '../model/productionProcess'
import {
  getWeekClosureBlockers,
  isWeekAutomaticallyClosed,
  type WeekClosureBlocker,
} from '../model/weekLifecycle'

const DAYS_STORAGE_KEY = TRABUNDA_STORAGE_KEYS.productionDays
const LEGACY_DAYS_STORAGE_KEY = TRABUNDA_LEGACY_STORAGE_KEYS.productionDays
const ACTIVE_WEEK_STORAGE_KEY = TRABUNDA_STORAGE_KEYS.activeOperationalWeek
const ACTIVE_PROCESS_STORAGE_KEY = TRABUNDA_STORAGE_KEYS.activeProductionProcess
const WEEK_CLOSURES_STORAGE_KEY = TRABUNDA_STORAGE_KEYS.weekProcessClosures
const LEGACY_WEEK_CLOSURES_STORAGE_KEY = TRABUNDA_LEGACY_STORAGE_KEYS.weekClosures
const SEEDED_WEEK_NUMBER = getOperationalWeekContextForIsoDate(
  WEEK_36_2026_PRODUCTION_DAYS[0]!.date,
).number
const PERMANENT_PRODUCTION_DAYS: readonly ProductionDay[] = [
  ...WEEK_36_2026_PRODUCTION_DAYS,
  MONDAY_WEEK_42_PRODUCTION_DAY,
]
const PERMANENT_DAY_KEYS = new Set(
  PERMANENT_PRODUCTION_DAYS.map((day) =>
    productionDayKey(day.date, getProductionProcess(day)),
  ),
)
const PERMANENT_WEEK_NUMBERS = [
  ...new Set(
    PERMANENT_PRODUCTION_DAYS.map(
      (day) => getOperationalWeekContextForIsoDate(day.date).number,
    ),
  ),
]
const PERMANENTLY_CLOSED_WEEK_NUMBERS = new Set([SEEDED_WEEK_NUMBER])

export type WeekClosureType = 'PERMANENT' | 'MANUAL' | 'AUTOMATIC'

export interface StoredWeekClosure {
  readonly weekNumber: number
  readonly process: ProductionProcess
  readonly status: 'CLOSED'
  readonly closureType: 'MANUAL'
  readonly closedAt: string
}

export interface OperationalCalendarDay {
  label: string
  date: string
  isoDate: string
}

export interface OperationalWeekView {
  number: number
  process: ProductionProcess
  period: WeeklySummaryPeriod
  calendarDays: readonly OperationalCalendarDay[]
  productionDays: readonly ProductionDay[]
  temporalStatus: OperationalWeekTemporalStatus
  businessStatus: OperationalWeekBusinessStatus
  closureType: WeekClosureType | null
  closedAt: string | null
  isCurrent: boolean
  isPast: boolean
  isFuture: boolean
  isClosed: boolean
  isReadOnly: boolean
  canCreate: boolean
  canCloseManually: boolean
  closureBlockers: readonly WeekClosureBlocker[]
}

interface ProductionDataValue {
  activeWeek: OperationalWeekView
  activeProcess: ProductionProcess
  activeWeekNumber: number
  availableWeekNumbers: readonly number[]
  allProductionDays: readonly ProductionDay[]
  subsequentBalanceLots: readonly BalanceLot[]
  setActiveWeekNumber: (weekNumber: number) => void
  setActiveProcess: (process: ProductionProcess) => void
  getWeekState: (
    weekNumber: number,
    process?: ProductionProcess,
  ) => OperationalWeekState
  getWeekView: (
    weekNumber: number,
    process?: ProductionProcess,
  ) => OperationalWeekView
  closeWeekManually: (
    weekNumber: number,
    process?: ProductionProcess,
  ) => void
  findProductionDay: (
    date: string,
    process?: ProductionProcess,
  ) => ProductionDay | undefined
  isUserManagedDay: (date: string, process?: ProductionProcess) => boolean
  upsertProductionDay: (
    productionDay: ProductionDay,
    options?: { allowReplace?: boolean },
  ) => void
}

const weekdayFormatter = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long',
  timeZone: 'UTC',
})

function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase('es-PE') + value.slice(1)
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

function buildCalendarDays(period: WeeklySummaryPeriod): readonly OperationalCalendarDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const isoDate = addDays(period.startDate, index)
    return {
      label: capitalize(
        weekdayFormatter.format(new Date(`${isoDate}T00:00:00Z`)),
      ),
      date: formatShortDate(isoDate),
      isoDate,
    }
  })
}

function isProductionDay(value: unknown): value is ProductionDay {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ProductionDay>

  return (
    typeof candidate.id === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(candidate.date ?? '') &&
    typeof candidate.displayName === 'string' &&
    Array.isArray(candidate.rawMaterialEntries) &&
    Array.isArray(candidate.lines) &&
    Array.isArray(candidate.receivedBalanceLots) &&
    typeof candidate.declaredRawMaterialKg100 === 'number' &&
    typeof candidate.declaredFinishedTotalKg100 === 'number' &&
    (candidate.process === undefined || isProductionProcess(candidate.process))
  )
}

function normalizeNucaClassification(day: ProductionDay): ProductionDay {
  const semilimpiaProductIds = new Set(
    day.lines
      .filter((line) => {
        const normalizedProductName = line.productName
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLocaleUpperCase('es-PE')

        return (
          line.productId === 'nuca-semilimpia-codificada' ||
          (normalizedProductName.includes('NUCA') &&
            normalizedProductName.includes('SEMI LIMPI'))
        )
      })
      .map((line) => line.productId),
  )

  if (semilimpiaProductIds.size === 0) return day

  return {
    ...day,
    lines: day.lines.map((line) =>
      semilimpiaProductIds.has(line.productId)
        ? {
            ...line,
            familyId: 'nuca-semilimpia',
            familyName: 'NUCA SEMILIMPIA',
            summaryGroupId: 'NUCA_SEMILIMPIA',
          }
        : line,
    ),
    receivedBalanceLots: day.receivedBalanceLots.map((lot) =>
      semilimpiaProductIds.has(lot.productId)
        ? { ...lot, familyId: 'nuca-semilimpia' }
        : lot,
    ),
  }
}

function loadStoredDays(): readonly ProductionDay[] {
  if (typeof window === 'undefined') return []

  try {
    const currentStored = window.localStorage.getItem(DAYS_STORAGE_KEY)
    const legacyStored = window.localStorage.getItem(LEGACY_DAYS_STORAGE_KEY)
    const stored = currentStored ?? legacyStored ?? '[]'
    const parsed = JSON.parse(stored)
    const normalized = Array.isArray(parsed)
      ? parsed
          .filter(isProductionDay)
          .map(normalizeNucaClassification)
          .map((day) => ({
            ...day,
            process: getProductionProcess(day),
            receivedBalanceLots: day.receivedBalanceLots.map((lot) => ({
              ...lot,
              process: isProductionProcess(lot.process)
                ? lot.process
                : getProductionProcess(day),
            })),
          }))
          .filter(
            (day) =>
              !PERMANENT_DAY_KEYS.has(
                productionDayKey(day.date, getProductionProcess(day)),
              ),
          )
      : []
    if (currentStored === null && legacyStored !== null) {
      window.localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(normalized))
    }
    return normalized
  } catch {
    return []
  }
}

function isStoredWeekClosure(value: unknown): value is StoredWeekClosure {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<StoredWeekClosure>
  return (
    Number.isSafeInteger(candidate.weekNumber) &&
    isProductionProcess(candidate.process ?? 'PACKING') &&
    candidate.status === 'CLOSED' &&
    candidate.closureType === 'MANUAL' &&
    typeof candidate.closedAt === 'string'
  )
}

function loadStoredWeekClosures(): readonly StoredWeekClosure[] {
  if (typeof window === 'undefined') return []

  try {
    const currentStored = window.localStorage.getItem(WEEK_CLOSURES_STORAGE_KEY)
    const legacyStored = window.localStorage.getItem(LEGACY_WEEK_CLOSURES_STORAGE_KEY)
    const stored = currentStored ?? legacyStored ?? '[]'
    const parsed = JSON.parse(stored)
    const normalized = Array.isArray(parsed)
      ? parsed
          .filter(isStoredWeekClosure)
          .map((closure) => ({
            ...closure,
            process: closure.process ?? 'PACKING',
          }))
      : []
    if (currentStored === null && legacyStored !== null) {
      window.localStorage.setItem(
        WEEK_CLOSURES_STORAGE_KEY,
        JSON.stringify(normalized),
      )
    }
    return normalized
  } catch {
    return []
  }
}

function getInitialActiveProcess(): ProductionProcess {
  if (typeof window === 'undefined') return 'PACKING'
  const stored = window.localStorage.getItem(ACTIVE_PROCESS_STORAGE_KEY)
  return isProductionProcess(stored) ? stored : 'PACKING'
}

function getInitialActiveWeek(): number {
  const currentWeek = getOperationalWeekContext(new Date())
  if (typeof window === 'undefined') return currentWeek.number

  const storedWeek = Number(window.localStorage.getItem(ACTIVE_WEEK_STORAGE_KEY))
  const storedWeekState = Number.isSafeInteger(storedWeek)
    ? getOperationalWeekState(
        getOperationalWeekContextByNumber(storedWeek),
        currentWeek,
      )
    : null
  if (
    Number.isSafeInteger(storedWeek) &&
    storedWeek >= SEEDED_WEEK_NUMBER &&
    storedWeekState?.isFuture === false
  ) {
    return storedWeek
  }

  try {
    window.localStorage.setItem(
      ACTIVE_WEEK_STORAGE_KEY,
      String(currentWeek.number),
    )
  } catch {
    // The valid week is still used when storage is unavailable.
  }
  return currentWeek.number
}

function sortDays(days: readonly ProductionDay[]): readonly ProductionDay[] {
  return [...days].sort(
    (first, second) =>
      first.date.localeCompare(second.date) ||
      getProductionProcess(first).localeCompare(getProductionProcess(second)),
  )
}

function getWeekProductionDays(
  number: number,
  userDays: readonly ProductionDay[],
  process: ProductionProcess,
): readonly ProductionDay[] {
  const { period } = getOperationalWeekContextByNumber(number)
  const permanentDays = PERMANENT_PRODUCTION_DAYS.filter(
    (day) =>
      getProductionProcess(day) === process &&
      day.date >= period.startDate &&
      day.date <= period.endDate,
  )

  return sortDays([
    ...permanentDays,
    ...userDays.filter(
      (day) =>
        day.date >= period.startDate &&
        day.date <= period.endDate &&
        getProductionProcess(day) === process &&
        !PERMANENT_DAY_KEYS.has(productionDayKey(day.date, process)),
    ),
  ])
}

function resolveWeekClosure(
  number: number,
  process: ProductionProcess,
  period: WeeklySummaryPeriod,
  productionDays: readonly ProductionDay[],
  storedClosures: readonly StoredWeekClosure[],
): { closureType: WeekClosureType | null; closedAt: string | null } {
  if (process === 'PACKING' && PERMANENTLY_CLOSED_WEEK_NUMBERS.has(number)) {
    return { closureType: 'PERMANENT', closedAt: null }
  }

  const manualClosure = storedClosures.find(
    (closure) =>
      closure.weekNumber === number && closure.process === process,
  )
  if (manualClosure) {
    return {
      closureType: manualClosure.closureType,
      closedAt: manualClosure.closedAt,
    }
  }

  if (isWeekAutomaticallyClosed(period, productionDays)) {
    return { closureType: 'AUTOMATIC', closedAt: null }
  }

  return { closureType: null, closedAt: null }
}

function buildWeekView(
  number: number,
  userDays: readonly ProductionDay[],
  process: ProductionProcess = 'PACKING',
  storedClosures: readonly StoredWeekClosure[] = [],
  currentWeek = getOperationalWeekContext(new Date()),
): OperationalWeekView {
  const { period } = getOperationalWeekContextByNumber(number)
  const productionDays = getWeekProductionDays(number, userDays, process)
  const closure = resolveWeekClosure(
    number,
    process,
    period,
    productionDays,
    storedClosures,
  )
  const businessStatus: OperationalWeekBusinessStatus = closure.closureType
    ? 'CLOSED'
    : 'OPEN'
  const state = getOperationalWeekState(
    { number, period },
    currentWeek,
    businessStatus,
  )
  const closureBlockers = getWeekClosureBlockers(productionDays)

  return {
    number,
    process,
    period,
    calendarDays: buildCalendarDays(period),
    productionDays,
    ...state,
    closureType: closure.closureType,
    closedAt: closure.closedAt,
    canCloseManually: businessStatus === 'OPEN' && !state.isFuture,
    closureBlockers,
  }
}

const historicalWeek = buildWeekView(SEEDED_WEEK_NUMBER, [])
const currentWeekAtStartup = getOperationalWeekContext(new Date()).number

const fallbackValue: ProductionDataValue = {
  activeWeek: historicalWeek,
  activeProcess: 'PACKING',
  activeWeekNumber: SEEDED_WEEK_NUMBER,
  availableWeekNumbers: [
    ...new Set([...PERMANENT_WEEK_NUMBERS, currentWeekAtStartup]),
  ],
  allProductionDays: PERMANENT_PRODUCTION_DAYS,
  subsequentBalanceLots: WEEK_36_2026_SUBSEQUENT_BALANCE_LOTS,
  setActiveWeekNumber: () => undefined,
  setActiveProcess: () => undefined,
  getWeekState: (weekNumber, process = 'PACKING') => {
    const week = buildWeekView(weekNumber, [], process)
    return getOperationalWeekState(
      week,
      getOperationalWeekContext(new Date()),
      week.businessStatus,
    )
  },
  getWeekView: (weekNumber, process = 'PACKING') =>
    buildWeekView(weekNumber, [], process),
  closeWeekManually: () => {
    throw new Error('ProductionDataProvider is required to close weeks.')
  },
  findProductionDay: (date, process = 'PACKING') =>
    PERMANENT_PRODUCTION_DAYS.find(
      (day) => day.date === date && getProductionProcess(day) === process,
    ),
  isUserManagedDay: () => false,
  upsertProductionDay: () => {
    throw new Error('ProductionDataProvider is required to save production days.')
  },
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

  const upsertProductionDay = useCallback((
    productionDay: ProductionDay,
    options: { allowReplace?: boolean } = {},
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
    if (existingDay && !options.allowReplace) {
      throw new Error(
        'Ya existe una jornada para esta fecha. Abre la jornada existente para continuar.',
      )
    }

    const next = sortDays([
      ...userDays.filter(
        (day) =>
          productionDayKey(day.date, getProductionProcess(day)) !== dayKey,
      ),
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
    }
  }, [
    activeWeekNumber,
    activeProcess,
    closeWeekManually,
    currentWeekNumber,
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
