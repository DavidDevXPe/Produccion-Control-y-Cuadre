import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  ImagePlus,
} from 'lucide-react'
import { Fragment, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DataTableScroll } from '../../../components/ui/DataTableScroll'
import { MetricCard } from '../../../components/ui/MetricCard'
import { PageHeader } from '../../../components/ui/PageHeader'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { FamilyYieldPanel } from '../components/FamilyYieldPanel'
import {
  ClosingBalanceRowControl,
  ClosingBalanceYieldControl,
} from '../components/ClosingBalanceYieldControl'
import { TubeMpBalancePanel } from '../components/TubeMpBalancePanel'
import { ProcessSelector } from '../components/ProcessSelector'
import { usePageTitle } from '../../../hooks/usePageTitle'
import { formatCentiKg, formatIsoDate } from '../../../utils/formatters'
import { getOperationalWeekContextForIsoDate } from '../../../utils/operationalContext'
import {
  buildProductionDayFromCapture,
  createCaptureDraftFromDay,
  createEmptyCaptureDraft,
  hasSufficientCaptureData,
  sumImportedBalances,
  type ProductionCaptureDraft,
  type ProductionCaptureBalanceUse,
  type ProductionCaptureRow,
} from '../capture/productionCapture'
import {
  CAPTURE_CATALOG_ITEMS,
  confirmProductionCatalogItem,
  filterCaptureCatalogItems,
  PRODUCTION_CATALOG_ITEMS,
  type ProductionCatalogItem,
} from '../capture/productionCatalog'
import { normalizeProductName } from '../capture/productNormalizer'
import {addAliasToActiveProduct, getActiveProducts } from '../capture/productCatalogRepository'
import type { ParsedProductionSheet } from '../capture/parseProductionWorkbook'
import {
  buildBalanceShiftDiagnostics,
  buildProductionDiagnostics,
  calculateReportFamilySubtotals,
  calculateProductionBusinessSummary,
  validateProductionClosure,
} from '../model/businessRules'
import {
  calculateOutstandingBalances,
  kg100,
  sumKg100,
} from '../model/calculations'
import { calculateFreezingAvailability } from '../model/freezing'
import { isSundayIsoDate } from '../model/productionDayMode'
import {
  getProductionProcess,
  isPackingProductionDay,
  isProductionProcess,
  productionDayKey,
} from '../model/productionProcess'
import type { ProductionProcess } from '../model/types'
import { useProductionData } from '../state/ProductionDataContext'

type CaptureMode = 'MANUAL' | 'EXCEL' | 'SCREENSHOT'

interface QuantityInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  disabled?: boolean
  className?: string
}

function QuantityInput({
  label,
  value,
  onChange,
  readOnly = false,
  disabled = false,
  className = '',
}: QuantityInputProps) {
  const clearedZeroOnFocus = useRef(false)

  return (
    <label className={`block ${className}`}>
      {label ? (
        <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
          {label}
        </span>
      ) : null}
      <span className="relative block">
        <input
          type="number"
          min="0"
          step="0.01"
          inputMode="decimal"
          value={value}
          readOnly={readOnly}
          disabled={disabled}
          onFocus={() => {
            if (
              !readOnly &&
              !disabled &&
              value.trim() !== '' &&
              Number(value.replace(',', '.')) === 0
            ) {
              clearedZeroOnFocus.current = true
              onChange('')
            } else {
              clearedZeroOnFocus.current = false
            }
          }}
          onBlur={() => {
            if (clearedZeroOnFocus.current && value.trim() === '') {
              onChange('0')
            }
            clearedZeroOnFocus.current = false
          }}
          onChange={(event) => onChange(event.target.value)}
          className="number-tabular h-10 w-full rounded-lg border border-slate-200 bg-white px-3 pr-9 text-right text-sm font-semibold text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 read-only:cursor-default read-only:bg-slate-100 read-only:text-slate-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[0.6875rem] font-bold text-slate-400">
          kg
        </span>
      </span>
    </label>
  )
}

function createRow(productId: string, index: number): ProductionCaptureRow | null {
  const product = CAPTURE_CATALOG_ITEMS.find(
    (item) => item.productId === productId,
  ) ?? PRODUCTION_CATALOG_ITEMS.find((item) => item.productId === productId)
  if (!product) return null

  return {
    key: `manual-${product.productId}-${Date.now()}-${index}`,
    product,
    dayReportedKg: '',
    dayPreviousBalanceKg: '0',
    nightReportedKg: '',
    nightPreviousBalanceKg: '0',
    tunnelDayKg: '0',
    tunnelNightKg: '0',
    treatmentKg: '0',
    closingBalanceKg: '0',
    finishedKg: '',
  }
}

function shiftDifferenceMessage(
  label: 'Día' | 'Noche',
  differenceKg100: ReturnType<typeof kg100>,
) {
  if (differenceKg100 === 0) return `Turno ${label} conciliado.`
  if (differenceKg100 > 0) {
    return `Faltan ${formatCentiKg(differenceKg100)} por registrar en Turno ${label}.`
  }
  return `Sobran ${formatCentiKg(kg100(-differenceKg100))} en el detalle del Turno ${label}.`
}

function captureQuantityKg100(value: string) {
  const quantity = Number(value.trim().replace(',', '.'))
  return Number.isFinite(quantity) && quantity >= 0
    ? kg100(Math.round(quantity * 100))
    : kg100(0)
}

function isTreatmentOnlyProduct(product: ProductionCatalogItem): boolean {
  const productId = product.productId.toLowerCase()

  const productName = normalizeProductName(
    product.canonicalName ?? product.productName,
  )

  return (
    productId.includes('tratamiento') ||
    productName.includes('EN TRATAMIENTO')
  )
}

function isCaptureDraftEmpty(draft: ProductionCaptureDraft): boolean {
  return (
    draft.source === 'MANUAL' &&
    draft.declaredDayTotalKg.trim() === '' &&
    draft.declaredNightTotalKg.trim() === '' &&
    (draft.rawMaterialKg.trim() === '' || draft.rawMaterialKg === '0') &&
    draft.rows.length === 0 &&
    draft.balanceUses.length === 0 &&
    draft.importedBalances.length === 0 &&
    !draft.hasTunnelProduction &&
    !draft.nucaWashConfirmed
  )
}

function captureBalancePosition(balance: ProductionCaptureBalanceUse) {
  const dayKg100 = captureQuantityKg100(balance.dayKg)
  const nightKg100 = captureQuantityKg100(balance.nightKg)
  const processedKg100 = sumKg100([dayKg100, nightKg100])

  return {
    processedKg100,
    pendingKg100: kg100(
      Math.max(balance.availableKg100 - processedKg100, 0),
    ),
    overusedKg100: kg100(
      Math.max(processedKg100 - balance.availableKg100, 0),
    ),
  }
}

function captureProductAvailability(
  draft: ProductionCaptureDraft,
  productId: string,
) {
  const balances = draft.balanceUses.filter(
    (balance) => balance.productId === productId,
  )
  const availableKg100 = sumKg100(
    balances.map((balance) => balance.availableKg100),
  )
  const frozenKg100 = sumKg100(
    balances.flatMap((balance) => [
      captureQuantityKg100(balance.dayKg),
      captureQuantityKg100(balance.nightKg),
    ]),
  )

  return {
    availableKg100,
    frozenKg100,
    pendingKg100: kg100(Math.max(availableKg100 - frozenKg100, 0)),
  }
}

export function ProductionEntryPage() {
  const { date: editingDate } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    activeWeekNumber,
    allProductionDays,
    subsequentBalanceLots,
    findProductionDay,
    getWeekState,
    getWeekView,
    isUserManagedDay,
    activeProcess,
    setActiveProcess,
    upsertProductionDay,
  } = useProductionData()
  const processParam = searchParams.get('process')
  const selectedProcess = isProductionProcess(processParam)
    ? processParam
    : activeProcess
  const activeWeek = getWeekView(activeWeekNumber, selectedProcess)
  const existingDay = editingDate
    ? findProductionDay(editingDate, selectedProcess)
    : undefined
  const activeWeekState = activeWeek
  const editingWeekState = editingDate
    ? getWeekState(
        getOperationalWeekContextForIsoDate(editingDate).number,
        selectedProcess,
      )
    : null
  const isEditingAllowed = editingDate
    ? isUserManagedDay(editingDate, selectedProcess) &&
      existingDay?.status !== 'CLOSED' &&
      editingWeekState?.canCreate === true
    : activeWeek.canCreate
  const suggestedDate =
    activeWeekState.canCreate
      ? activeWeek.calendarDays.find(
          (day) => !findProductionDay(day.isoDate, selectedProcess),
        )?.isoDate ?? activeWeek.period.startDate
      : activeWeek.period.startDate
  const [mode, setMode] = useState<CaptureMode>(
    existingDay?.lines.at(0)?.source.sheet === 'CAPTURA WEB'
      ? 'MANUAL'
      : existingDay
        ? existingDay.lines.at(0)?.source.sheet === 'CAPTURA IMAGEN'
          ? 'SCREENSHOT'
          : 'EXCEL'
        : 'MANUAL',
  )
  const [draft, setDraft] = useState<ProductionCaptureDraft>(() =>
    existingDay
      ? createCaptureDraftFromDay(existingDay, allProductionDays)
      : createEmptyCaptureDraft(suggestedDate, selectedProcess),
  )
  const processDraftsRef = useRef<
    Partial<Record<ProductionProcess, ProductionCaptureDraft>>
  >({ [draft.process]: draft })
  const processModesRef = useRef<Partial<Record<ProductionProcess, CaptureMode>>>(
    { [draft.process]: mode },
  )
  const [pendingProcessChange, setPendingProcessChange] =
    useState<ProductionProcess | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [treatmentSearch, setTreatmentSearch] = useState('')
  const [selectedTreatmentProductId, setSelectedTreatmentProductId] = useState('')
  const [treatmentProductIds, setTreatmentProductIds] = 
    useState<Set<string>>(() => new Set() )
  const effectiveTreatmentProductIds = useMemo(() => {
    const ids = new Set(treatmentProductIds)
    for (const row of draft.rows) {
      if (captureQuantityKg100(row.treatmentKg) > 0) {
          ids.add(row.product.productId)
        }
      }
      return ids
    }, [draft.rows, treatmentProductIds])

  const [tunnelSearch, setTunnelSearch] = useState('')
  const [selectedTunnelProductId, setSelectedTunnelProductId] = useState('')
  const [tunnelProductIds, setTunnelProductIds] =
  useState<Set<string>>(() => new Set())

  const effectiveTunnelProductIds = useMemo(() => {
    const ids = new Set(tunnelProductIds)

    for (const row of draft.rows) {
      if (
        captureQuantityKg100(row.tunnelDayKg) > 0 ||
        captureQuantityKg100(row.tunnelNightKg) > 0
      ) {
        ids.add(row.product.productId)
      }
    }

    return ids
  }, [draft.rows, tunnelProductIds])
  const [closingSearch, setClosingSearch] = useState('')
  const [selectedClosingProductId, setSelectedClosingProductId] = useState('')
  const [closingProductIds, setClosingProductIds] = useState<Set<string>>(
    () =>
      new Set(
        existingDay?.lines
          .filter((line) => line.newClosingBalanceKg100 > 0)
          .map((line) => line.productId) ?? [],
      ),
  )
  const [selectedBalanceKey, setSelectedBalanceKey] = useState('')
  const [isCloseConfirmationOpen, setIsCloseConfirmationOpen] = useState(false)
  const [tunnelToggleError, setTunnelToggleError] = useState('')
  const [parsedSheets, setParsedSheets] = useState<
    readonly ParsedProductionSheet[]
  >([])
  const [selectedSheetName, setSelectedSheetName] = useState('')
  const [fileName, setFileName] = useState('')
  const [importState, setImportState] = useState<
    'IDLE' | 'READING' | 'READY' | 'ERROR'
  >('IDLE')
  const [screenshotShift, setScreenshotShift] = useState<'DAY' | 'NIGHT'>('DAY')
  const [screenshotWarnings, setScreenshotWarnings] = useState<readonly string[]>([])
  const [pendingProducts, setPendingProducts] = useState<ProductionCatalogItem[]>([])
  const [catalogItems, setCatalogItems] = useState<ProductionCatalogItem[]>(() => getActiveProducts() )
  const [possibleMatches, setPossibleMatches] = useState<readonly { sourceText: string; product: ProductionCatalogItem; date: string | null; totalKg: number }[]>([])
  const [otherDateRows, setOtherDateRows] = useState<readonly { product: ProductionCatalogItem; date: string | null; totalKg: number }[]>([])
  const [captureSummary, setCaptureSummary] = useState<{ sourceGrandTotalKg: number | null; reconstructedGrandTotalKg: number; selectedDateTotalKg: number } | null>(null)
  const [saveError, setSaveError] = useState('')
  const isSunday = isSundayIsoDate(draft.date)
  const isFreezing = draft.process === 'FREEZING'
  const isBalanceOnly =
    isSunday && draft.operationMode === 'BALANCE_ONLY' && !isFreezing
  const usesExternalAvailability = isBalanceOnly || isFreezing

  usePageTitle(existingDay ? 'Editar jornada' : 'Nueva jornada')

  const buildResult = useMemo(
    () =>
      buildProductionDayFromCapture(
        draft,
        allProductionDays.filter(
          (day) =>
            productionDayKey(day.date, getProductionProcess(day)) !==
            productionDayKey(draft.date, draft.process),
        ),
        subsequentBalanceLots,
      ),
    [allProductionDays, draft, subsequentBalanceLots],
  )
  const hasSufficientData = hasSufficientCaptureData(draft)
  const businessSummary = useMemo(
    () =>
      calculateProductionBusinessSummary(
        buildResult.productionDay,
        buildResult.calculation,
      ),
    [buildResult],
  )
  const reportFamilySubtotals = useMemo(
    () => calculateReportFamilySubtotals(buildResult.productionDay),
    [buildResult.productionDay],
  )
  const closureValidation = useMemo(
    () =>
      validateProductionClosure(
        buildResult.productionDay,
        buildResult.calculation,
        {
          requiredDataComplete: hasSufficientData,
          inputErrors: buildResult.inputErrors,
        },
      ),
    [buildResult, hasSufficientData],
  )
  const canClose = closureValidation.canClose
  const diagnostics = useMemo(
    () =>
      usesExternalAvailability
        ? []
        : buildProductionDiagnostics(buildResult.calculation, businessSummary),
    [buildResult.calculation, businessSummary, usesExternalAvailability],
  )
  const balanceShiftDiagnostics = useMemo(
    () => buildBalanceShiftDiagnostics(buildResult.calculation),
    [buildResult.calculation],
  )
  const dayHasReportData =
    draft.declaredDayTotalKg.trim() !== '' && draft.rows.length > 0
  const nightHasReportData =
    draft.declaredNightTotalKg.trim() !== '' && draft.rows.length > 0
  const hasReportData = dayHasReportData && nightHasReportData
  const reportsReconciled =
    hasReportData &&
    buildResult.calculation.day.detailDifferenceKg100 === 0 &&
    buildResult.calculation.night.detailDifferenceKg100 === 0
  const tunnelMovementRequired =
    draft.hasTunnelProduction && buildResult.calculation.tunnel.totalKg100 === 0
  const footerStatus = canClose
  ? closureValidation.warnings.length > 0
    ? {
        title: 'La jornada puede cerrarse con observaciones.',
        description:
          'El cuadre principal es válido, pero existen advertencias que quedarán sujetas a revisión.',
      }
    : {
        title: 'La jornada está lista para cerrar.',
        description: usesExternalAvailability
          ? isFreezing
            ? 'Los reportes coinciden y todo el producto congelado tiene origen trazable en Envasado.'
            : 'Los reportes y consumos de saldo están conciliados sin producción propia.'
          : 'El cuadre es correcto y no existen diferencias pendientes.',
      }
  : hasSufficientData
    ? {
        title: 'La jornada todavía requiere revisión.',
        description:
          'Revisa el cuadre y las validaciones pendientes antes de cerrar.',
      }
    : {
        title: 'Completa los datos requeridos para validar la jornada.',
        description:
          'Puedes guardar un borrador válido y continuar después.',
      }
  const importedBalanceTotal = sumImportedBalances(draft.importedBalances)
  const importedBalanceMatches =
    importedBalanceTotal === buildResult.calculation.newClosingBalanceKg100
  const freezingAvailabilityPositions = useMemo(
    () =>
      isFreezing
        ? calculateFreezingAvailability(
            allProductionDays.filter(
              (day) =>
                productionDayKey(day.date, getProductionProcess(day)) !==
                productionDayKey(draft.date, draft.process),
            ),
            draft.date,
          )
        : [],
    [allProductionDays, draft.date, draft.process, isFreezing],
  )
  const freezingAvailabilityByProduct = useMemo(() => {
    if (!isFreezing) return new Map<string, ReturnType<typeof kg100>>()
    const totals = new Map<string, ReturnType<typeof kg100>>()
    for (const position of freezingAvailabilityPositions) {
      totals.set(
        position.productId,
        kg100((totals.get(position.productId) ?? 0) + position.pendingKg100),
      )
    }
    return totals
  }, [freezingAvailabilityPositions, isFreezing])
  const filteredCatalogItems = useMemo(
    () =>
      filterCaptureCatalogItems(productSearch, catalogItems)
        .filter(
          (product) =>
            !isTreatmentOnlyProduct(product) &&
            !draft.rows.some(
              (row) => row.product.productId === product.productId,
            ),
        )
        .sort((first, second) =>
          isFreezing
            ? (freezingAvailabilityByProduct.get(second.productId) ?? 0) -
              (freezingAvailabilityByProduct.get(first.productId) ?? 0)
            : 0,
        ),
    [
      catalogItems,
      draft.rows,
      freezingAvailabilityByProduct,
      isFreezing,
      productSearch,
    ],
  )
  const treatmentCatalogItems = useMemo(
    () =>
      filterCaptureCatalogItems(treatmentSearch, catalogItems).filter(
        (product) =>
          !effectiveTreatmentProductIds.has(product.productId),
      ),
    [
      catalogItems,
      effectiveTreatmentProductIds,
      treatmentSearch,
    ],
  )
  const tunnelCatalogItems = useMemo(
    () =>
      filterCaptureCatalogItems(tunnelSearch, catalogItems).filter(
        (product) =>
          !effectiveTunnelProductIds.has(product.productId),
      ),
    [
      catalogItems,
      effectiveTunnelProductIds,
      tunnelSearch,
    ],
  )
  const closingCatalogItems = useMemo(
    () =>
      filterCaptureCatalogItems(closingSearch, catalogItems).filter(
        (product) => !closingProductIds.has(product.productId),
      ),
    [catalogItems, closingProductIds, closingSearch],
  )
  const closingRows = useMemo(
    () =>
      draft.rows.filter(
        (row) =>
          closingProductIds.has(row.product.productId) ||
          captureQuantityKg100(row.closingBalanceKg) > 0,
      ),
    [closingProductIds, draft.rows],
  )
  const treatmentRows = useMemo(
  () =>
    draft.rows.filter((row) =>
      effectiveTreatmentProductIds.has(row.product.productId),
    ),
  [draft.rows, effectiveTreatmentProductIds],
  )
  const tunnelRows = useMemo(
    () =>
      draft.rows.filter((row) =>
        effectiveTunnelProductIds.has(row.product.productId),
      ),
    [draft.rows, effectiveTunnelProductIds],
  )
  const availableBalances = useMemo(() => {
    const selectedKeys = new Set(
      draft.balanceUses.map(
        (balance) =>
          `${balance.originDayId}|${balance.sourceProductId ?? balance.productId}`,
      ),
    )

    const positions = isFreezing
      ? freezingAvailabilityPositions
      : calculateOutstandingBalances(
          allProductionDays.filter(
            (day) => isPackingProductionDay(day) && day.date < draft.date,
          ),
          subsequentBalanceLots,
        )

    return positions.filter(
      (balance) =>
        balance.pendingKg100 > 0 &&
        !selectedKeys.has(`${balance.originDayId}|${balance.productId}`),
    )
  }, [
    allProductionDays,
    draft.balanceUses,
    draft.date,
    freezingAvailabilityPositions,
    isFreezing,
    subsequentBalanceLots,
  ])
  const totalReportedKg100 = sumKg100([
    buildResult.calculation.day.declaredReportedKg100,
    buildResult.calculation.night.declaredReportedKg100,
  ])
  const freezingAvailableFromPackingKg100 = sumKg100(
    freezingAvailabilityPositions
      .filter((position) => position.originDate === draft.date)
      .map((position) => position.pendingKg100),
  )
  const freezingPreviousPendingKg100 = sumKg100(
    freezingAvailabilityPositions
      .filter((position) => position.originDate < draft.date)
      .map((position) => position.pendingKg100),
  )
  const freezingTotalAvailableKg100 = sumKg100([
    freezingAvailableFromPackingKg100,
    freezingPreviousPendingKg100,
  ])
  const freezingLinkedThisDayKg100 = sumKg100(
    draft.balanceUses.flatMap((balance) => [
      captureQuantityKg100(balance.dayKg),
      captureQuantityKg100(balance.nightKg),
    ]),
  )
  const freezingPendingAfterKg100 = kg100(
    Math.max(
      freezingTotalAvailableKg100 - freezingLinkedThisDayKg100,
      0,
    ),
  )
  const freezingUnexplainedDifferenceKg100 = kg100(
    totalReportedKg100 - freezingLinkedThisDayKg100,
  )

  const applyProcessChange = (process: ProductionProcess) => {
    if (editingDate || process === draft.process) return
    const processWeek = getWeekView(activeWeek.number, process)
    const nextDate = processWeek.calendarDays.find(
      (day) => !findProductionDay(day.isoDate, process),
    )?.isoDate ?? processWeek.period.startDate

    setActiveProcess(process)
    setSearchParams({ process }, { replace: true })
    processDraftsRef.current[draft.process] = draft
    processModesRef.current[draft.process] = mode
    const nextDraft =
      processDraftsRef.current[process] ??
      createEmptyCaptureDraft(nextDate, process)
    processDraftsRef.current[process] = nextDraft
    setMode(processModesRef.current[process] ?? 'MANUAL')
    setDraft(nextDraft)
    setProductSearch('')
    setSelectedProductId('')
    setSelectedBalanceKey('')
    setParsedSheets([])
    setSelectedSheetName('')
    setFileName('')
    setImportState('IDLE')
    setScreenshotWarnings([])
    setPendingProducts([])
    setPossibleMatches([])
    setOtherDateRows([])
    setCaptureSummary(null)
    setClosingProductIds(new Set())
    setSaveError('')
  }

  const changeProcess = (process: ProductionProcess) => {
    if (editingDate || process === draft.process) return
    if (!isCaptureDraftEmpty(draft)) {
      setPendingProcessChange(process)
      return
    }
    applyProcessChange(process)
  }

  if (!isEditingAllowed || (editingDate && !existingDay)) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <AlertTriangle className="mx-auto size-10 text-amber-600" aria-hidden="true" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">
          {editingDate
            ? 'Esta jornada no se puede editar'
            : 'Esta semana es de solo lectura'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Las semanas abiertas permiten captura; las semanas cerradas y futuras son de solo lectura.
        </p>
        <Link
          to="/jornadas"
          className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-bold text-white"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver a jornadas
        </Link>
      </div>
    )
  }

  const updateDraft = <Key extends keyof ProductionCaptureDraft>(
    key: Key,
    value: ProductionCaptureDraft[Key],
  ) => setDraft((current) => ({ ...current, [key]: value }))

  const updateDate = (date: string) => {
    const sunday = isSundayIsoDate(date)
    setDraft((current) => ({
      ...current,
      date,
      operationMode: sunday ? 'BALANCE_ONLY' : 'NORMAL',
      rawMaterialKg:
        sunday || current.process === 'FREEZING' ? '0' : current.rawMaterialKg,
    }))
    setSaveError('')
  }

  const updateRow = (
    key: string,
    field: keyof Omit<ProductionCaptureRow, 'key' | 'product'>,
    value: string,
  ) => {
    setDraft((current) => ({
      ...current,
      rows: current.rows.map((row) =>
        row.key === key ? { ...row, [field]: value } : row,
      ),
    }))
  }

  const updateTunnelCondition = (enabled: boolean) => {
    const hasTunnelMovements = draft.rows.some(
      (row) =>
        captureQuantityKg100(row.tunnelDayKg) > 0 ||
        captureQuantityKg100(row.tunnelNightKg) > 0,
    )

    if (!enabled && hasTunnelMovements) {
      setTunnelToggleError(
        'Existen productos de Túnel registrados. Elimina estos movimientos antes de desactivar la opción.',
      )
      return
    }

    updateDraft('hasTunnelProduction', enabled)
    setTunnelToggleError('')
  }

  const addSelectedProduct = () => {
    if (!selectedProductId) return
    if (draft.rows.some((row) => row.product.productId === selectedProductId)) {
      setSaveError('Ese producto ya está agregado a la jornada.')
      return
    }
    const row = createRow(selectedProductId, draft.rows.length)
    if (!row) return
    updateDraft('rows', [...draft.rows, row])
    setProductSearch('')
    setSelectedProductId('')
    setSaveError('')
  }

  const addMovementProduct = (
    productId: string,
    resetSelection: () => void,
  ) => {
    if (!productId) return
    if (draft.rows.some((row) => row.product.productId === productId)) {
      resetSelection()
      return
    }
    const row = createRow(productId, draft.rows.length)
    if (!row) return
    updateDraft('rows', [
      ...draft.rows,
      { ...row, dayReportedKg: '0', nightReportedKg: '0' },
    ])
    resetSelection()
    setSaveError('')
  }

  const addClosingProduct = () => {
    if (!selectedClosingProductId) return
    const productId = selectedClosingProductId
    setClosingProductIds((current) => new Set(current).add(productId))
    addMovementProduct(productId, () => {
      setClosingSearch('')
      setSelectedClosingProductId('')
    })
  }

  const removeClosingProduct = (rowKey: string) => {
  setDraft((current) => {
    const row = current.rows.find(
      (candidate) => candidate.key === rowKey,
    )

    if (!row) return current

    const productId = row.product.productId

    const hasOtherMovement =
      captureQuantityKg100(row.dayReportedKg) > 0 ||
      captureQuantityKg100(row.nightReportedKg) > 0 ||
      captureQuantityKg100(row.dayPreviousBalanceKg) > 0 ||
      captureQuantityKg100(row.nightPreviousBalanceKg) > 0 ||
      captureQuantityKg100(row.tunnelDayKg) > 0 ||
      captureQuantityKg100(row.tunnelNightKg) > 0 ||
      captureQuantityKg100(row.treatmentKg) > 0 ||
      captureQuantityKg100(row.finishedKg) > 0 ||
      current.balanceUses.some(
        (balance) => balance.productId === productId,
      )

    return {
      ...current,

      rows: hasOtherMovement
        ? current.rows.map((candidate) =>
            candidate.key === rowKey
              ? {
                  ...candidate,
                  closingBalanceKg: '0',
                }
              : candidate,
          )
        : current.rows.filter(
            (candidate) => candidate.key !== rowKey,
          ),
    }
  })

  setClosingProductIds((current) => {
    const next = new Set(current)

    const row = draft.rows.find(
      (candidate) => candidate.key === rowKey,
    )

    if (row) {
      next.delete(row.product.productId)
    }

    return next
  })

  setSaveError('')
}

  const removeTreatmentProduct = (rowKey: string) => {
  const selectedRow = draft.rows.find(
    (candidate) => candidate.key === rowKey,
  )

  if (!selectedRow) return

  const productId = selectedRow.product.productId

  setDraft((current) => {
    const row = current.rows.find(
      (candidate) => candidate.key === rowKey,
    )

    if (!row) return current

    const hasOtherMovement =
      captureQuantityKg100(row.dayReportedKg) > 0 ||
      captureQuantityKg100(row.nightReportedKg) > 0 ||
      captureQuantityKg100(row.dayPreviousBalanceKg) > 0 ||
      captureQuantityKg100(row.nightPreviousBalanceKg) > 0 ||
      captureQuantityKg100(row.tunnelDayKg) > 0 ||
      captureQuantityKg100(row.tunnelNightKg) > 0 ||
      captureQuantityKg100(row.closingBalanceKg) > 0 ||
      captureQuantityKg100(row.finishedKg) > 0 ||
      current.balanceUses.some(
        (balance) => balance.productId === productId,
      )

    return {
      ...current,

      rows: hasOtherMovement
        ? current.rows.map((candidate) =>
            candidate.key === rowKey
              ? {
                  ...candidate,
                  treatmentKg: '0',
                }
              : candidate,
          )
        : current.rows.filter(
            (candidate) => candidate.key !== rowKey,
          ),
    }
  })

  setTreatmentProductIds((current) => {
    const next = new Set(current)
    next.delete(productId)
    return next
  })

  setSaveError('')
}

  const addSelectedBalance = () => {
  const position = availableBalances.find(
    (balance) =>
      `${balance.originDayId}|${balance.productId}` === selectedBalanceKey,
  )

  if (!position) return

  const normalizedBalanceName = normalizeProductName(position.productName)

  const reportProduct = draft.rows.find(
    (row) =>
      row.product.familyId === position.familyId &&
      normalizeProductName(row.product.productName) === normalizedBalanceName,
  )?.product

  const catalogProduct =
    reportProduct ??
    catalogItems.find(
      (product) => product.productId === position.productId,
    ) ??
    catalogItems.find(
      (product) =>
        product.familyId === position.familyId &&
        (
          normalizeProductName(product.productName) === normalizedBalanceName ||
          normalizeProductName(product.canonicalName ?? '') === normalizedBalanceName ||
          (product.aliases ?? []).some(
            (alias) =>
              normalizeProductName(alias) === normalizedBalanceName,
          )
        ),
    )

  const requiresProductDistribution = !catalogProduct

  const resolvedProductId =
    catalogProduct?.productId ?? position.productId

  const balanceUse: ProductionCaptureBalanceUse = {
    key: `balance-${position.originDayId}-${position.productId}`,
    originDayId: position.originDayId,
    originDate: position.originDate,

    familyId: catalogProduct?.familyId ?? position.familyId,
    familyName: catalogProduct?.familyName ?? position.familyName,

    productId: resolvedProductId,
    productName:
      catalogProduct?.productName ?? 'Producto exacto no identificado',

    availableKg100: position.pendingKg100,

    dayKg: '0',
    nightKg: '0',

    sourceProductId: position.productId,

    requiresProductDistribution,
  }

  const productExists = draft.rows.some(
    (row) => row.product.productId === resolvedProductId,
  )

  const row =
    !catalogProduct || productExists
      ? null
      : createRow(resolvedProductId, draft.rows.length)

  setDraft((current) => ({
    ...current,

    rows:
      row === null
        ? current.rows
        : [
            ...current.rows,
            {
              ...row,
              dayReportedKg: '0',
              nightReportedKg: '0',
            },
          ],

    balanceUses: [...current.balanceUses, balanceUse],
  }))

  setSelectedBalanceKey('')
  setSaveError('')
}

  const updateBalanceUse = (
  key: string,
  field: 'dayKg' | 'nightKg',
  value: string,
) => {
  setDraft((current) => {
    const nextBalanceUses = current.balanceUses.map((balance) =>
      balance.key === key
        ? { ...balance, [field]: value }
        : balance,
    )

    // En jornadas normales y Congelamiento mantenemos
    // el comportamiento actual.
    if (!isBalanceOnly) {
      return {
        ...current,
        balanceUses: nextBalanceUses,
      }
    }

    // En domingo BALANCE_ONLY no existe una segunda captura
    // manual por producto. Los kg físicos del producto se
    // derivan de los saldos realmente procesados.
    const nextRows = current.rows.map((row) => {
      const productBalanceUses = nextBalanceUses.filter(
        (balance) =>
          balance.productId === row.product.productId &&
          balance.requiresProductDistribution !== true,
      )

      if (productBalanceUses.length === 0) {
        return row
      }

      const dayKg100 = sumKg100(
        productBalanceUses.map((balance) =>
          captureQuantityKg100(balance.dayKg),
        ),
      )

      const nightKg100 = sumKg100(
        productBalanceUses.map((balance) =>
          captureQuantityKg100(balance.nightKg),
        ),
      )

      return {
        ...row,
        dayReportedKg: String(dayKg100 / 100),
        nightReportedKg: String(nightKg100 / 100),
      }
    })

    return {
      ...current,
      balanceUses: nextBalanceUses,
      rows: nextRows,
    }
  })
}

  const distributeLegacyBalance = (key: string, productId: string) => {
    const product = catalogItems.find(
      (candidate) => candidate.productId === productId,
    )
    if (!product) return

    setDraft((current) => {
      const hasProductRow = current.rows.some(
        (row) => row.product.productId === product.productId,
      )
      const row = hasProductRow
        ? null
        : createRow(product.productId, current.rows.length)

      return {
        ...current,
        rows:
          row === null
            ? current.rows
            : [
                ...current.rows,
                { ...row, dayReportedKg: '0', nightReportedKg: '0' },
              ],
        balanceUses: current.balanceUses.map((balance) =>
          balance.key === key
            ? {
                ...balance,
                familyId: product.familyId,
                familyName: product.familyName,
                productId: product.productId,
                productName: product.productName,
                sourceProductId:
                  balance.sourceProductId ?? balance.productId,
                requiresProductDistribution: false,
              }
            : balance,
        ),
      }
    })
    setSaveError('')
  }

  const removeBalanceUse = (key: string) => {
    updateDraft(
      'balanceUses',
      draft.balanceUses.filter((balance) => balance.key !== key),
    )
  }

  const removeRow = (key: string) => {
    const productId = draft.rows.find(
      (row) => row.key === key,
    )?.product.productId
  
    if (productId) {
      setClosingProductIds((current) => {
        const next = new Set(current)
        next.delete(productId)
        return next
      })
    
      setTreatmentProductIds((current) => {
        const next = new Set(current)
        next.delete(productId)
        return next
      })
    
      setTunnelProductIds((current) => {
        const next = new Set(current)
        next.delete(productId)
        return next
      })
    }
  
    setDraft((current) => ({
      ...current,
      rows: current.rows.filter(
        (row) => row.key !== key,
      ),
      balanceUses: current.balanceUses.filter(
        (balance) => balance.productId !== productId,
      ),
    }))
  }

  const handleWorkbook = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportState('READING')
    setFileName(file.name)
    setSaveError('')

    try {
      const { parseProductionWorkbook } = await import(
        '../capture/parseProductionWorkbook'
      )
      const sheets = await parseProductionWorkbook(await file.arrayBuffer())
      if (sheets.length === 0) {
        throw new Error('No se encontraron hojas diarias válidas.')
      }
      setParsedSheets(sheets)
      setSelectedSheetName(sheets[0]!.sheetName)
      setImportState('READY')
    } catch {
      setParsedSheets([])
      setSelectedSheetName('')
      setImportState('ERROR')
    }
  }

  const handleScreenshot = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportState('READING')
    setFileName(file.name)
    setSaveError('')
    setScreenshotWarnings([])

    try {
      const { extractProductionScreenshot, mergeScreenshotIntoDraft } = await import(
        '../capture/parseProductionScreenshot'
      )
      const parsed = await extractProductionScreenshot(file, { targetDate: draft.date })
      if (parsed.rows.length === 0) {
        throw new Error('No se detectaron productos en la captura.')
      }
      const { replaceScreenshotShift } = await import(
        '../capture/parseProductionScreenshot'
      )
      setDraft((current) =>
        mergeScreenshotIntoDraft(
          replaceScreenshotShift(current, screenshotShift),
          parsed,
          screenshotShift,
        ),
      )
      setScreenshotWarnings(parsed.warnings)
      setPendingProducts((current) => [
        ...current,
        ...parsed.newProducts.filter(
          (candidate) => !current.some((existing) => existing.productId === candidate.productId),
        ),
      ])
      setPossibleMatches((current) => [
        ...current,
        ...parsed.possibleMatches.filter(
          (candidate) => !current.some((existing) => existing.sourceText === candidate.sourceText),
        ),
      ])
      setOtherDateRows((current) => [
        ...current,
        ...parsed.otherDateRows.map((row) => ({ product: row.product, date: row.date, totalKg: row.totalKg })),
      ])
      setCaptureSummary({
        sourceGrandTotalKg: parsed.sourceGrandTotalKg,
        reconstructedGrandTotalKg: parsed.reconstructedGrandTotalKg,
        selectedDateTotalKg: parsed.selectedDateTotalKg,
      })
      setImportState('READY')
    } catch (error) {
      setScreenshotWarnings([
        error instanceof Error
          ? error.message
          : 'No se pudo leer la captura. Verifica la calidad de la imagen.',
      ])
      setImportState('ERROR')
    } finally {
      event.target.value = ''
    }
  }

  const updatePendingProduct = (
    productId: string,
    field: 'canonicalName' | 'familyName' | 'familyId' | 'summaryGroupId' | 'technicalClassification',
    value: string,
  ) => {
    setPendingProducts((current) =>
      current.map((product) =>
        product.productId === productId
          ? {
              ...product,
              [field]: value,
              ...(field === 'canonicalName' ? { productName: value, normalizedName: normalizeProductName(value) } : {}),
            }
          : product,
      ),
    )
    if (field === 'canonicalName') {
      setDraft((current) => ({
        ...current,
        rows: current.rows.map((row) =>
          row.product.productId === productId
            ? { ...row, product: { ...row.product, productName: value, canonicalName: value, normalizedName: normalizeProductName(value) } }
            : row,
        ),
      }))
    }
  }

  const applyImportedSheet = async () => {
    const sheet = parsedSheets.find(
      (candidate) => candidate.sheetName === selectedSheetName,
    )
    if (!sheet) return
    const { createCaptureDraftFromImportedSheet } = await import(
      '../capture/parseProductionWorkbook'
    )
    const importedDraft = {
      ...createCaptureDraftFromImportedSheet(sheet),
      process: 'PACKING' as const,
    }
    setDraft(importedDraft)
    setClosingProductIds(
      new Set(
        importedDraft.rows
          .filter((row) => captureQuantityKg100(row.closingBalanceKg) > 0)
          .map((row) => row.product.productId),
      ),
    )
    setSaveError('')
  }

  const persist = (closeDay: boolean, confirmedWarnings = false) => {
    setSaveError('')
    const allowedPeriod = editingDate
      ? getOperationalWeekContextForIsoDate(editingDate).period
      : activeWeek.period
    if (
      draft.date < allowedPeriod.startDate ||
      draft.date > allowedPeriod.endDate
    ) {
      setSaveError(
        `La fecha debe permanecer dentro de la semana ${activeWeek.number}.`,
      )
      return
    }
    const next = buildProductionDayFromCapture(
      draft,
      allProductionDays.filter(
        (day) =>
          productionDayKey(day.date, getProductionProcess(day)) !==
          productionDayKey(draft.date, draft.process),
      ),
      subsequentBalanceLots,
      closeDay ? 'CLOSED' : 'DRAFT',
    )

    if (!closeDay && next.inputErrors.length > 0) {
      setSaveError(next.inputErrors[0] ?? 'Revisa los datos de la jornada.')
      return
    }
    if (closeDay) {
      const validation = validateProductionClosure(
        next.productionDay,
        next.calculation,
        {
          requiredDataComplete: hasSufficientCaptureData(draft),
          inputErrors: next.inputErrors,
        },
      )
      if (!validation.canClose) {
        setSaveError(
          validation.blockers[0]?.message ??
            'La jornada todavía tiene validaciones pendientes.',
        )
        return
      }
      if (!confirmedWarnings) {
        setIsCloseConfirmationOpen(true)
        return
      }
    }

    try {
      upsertProductionDay(next.productionDay, {
        allowReplace: Boolean(editingDate),
      })
      setIsCloseConfirmationOpen(false)
      navigate(
        `/jornadas/${next.productionDay.date}?process=${draft.process}`,
      )
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'No se pudo guardar la jornada.',
      )
    }
  }

  return (
    <div className="space-y-5 pb-[calc(var(--entry-action-bar-height)+1rem)] [--entry-action-bar-height:8.75rem] sm:[--entry-action-bar-height:4.25rem] xl:[--entry-action-bar-height:var(--sidebar-footer-height)]">
      <Link
        to="/jornadas"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-800"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Volver a jornadas
      </Link>

      <PageHeader
        eyebrow="Captura operativa"
        title={existingDay ? `Editar ${formatIsoDate(existingDay.date)}` : 'Nueva jornada'}
        description={
          isFreezing
            ? 'Registra lo congelado por turno y vincula cada kilo con el producto disponible desde Envasado.'
            : 'Registra los reportes de producción y concilia cada turno hasta obtener un cuadre exacto.'
        }
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <StatusBadge tone="info">
              {isFreezing ? 'CONGELAMIENTO' : 'ENVASADO'}
            </StatusBadge>
            <StatusBadge tone={canClose ? 'success' : 'warning'}>
              {canClose ? 'LISTA PARA CERRAR' : 'EN CAPTURA'}
            </StatusBadge>
            {isBalanceOnly ? (
              <StatusBadge tone="neutral">JORNADA DE SALDOS</StatusBadge>
            ) : null}
          </div>
        }
      />

      <ProcessSelector
        value={draft.process}
        disabled={Boolean(existingDay)}
        onChange={(process) => {
          if (process !== 'COMPARISON') changeProcess(process)
        }}
      />

      <div>
        <p className="mb-1.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-slate-500">
          Modo de registro
        </p>
        <div
          className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
          role="tablist"
          aria-label="Forma de ingreso"
        >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'MANUAL'}
          className={`min-h-9 rounded-lg px-4 text-xs font-bold transition ${
            mode === 'MANUAL'
              ? 'bg-brand-700 text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setMode('MANUAL')}
        >
          Ingreso manual
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'EXCEL'}
          disabled={isFreezing}
          title={
            isFreezing
              ? 'Importación de Congelamiento aún no disponible.'
              : undefined
          }
          className={`min-h-9 rounded-lg px-4 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            mode === 'EXCEL'
              ? 'bg-brand-700 text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setMode('EXCEL')}
        >
          Importar Excel
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'SCREENSHOT'}
          className={`min-h-9 rounded-lg px-4 text-xs font-bold transition ${
            mode === 'SCREENSHOT'
              ? 'bg-brand-700 text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setMode('SCREENSHOT')}
        >
          Captura de imagen
        </button>
        </div>
      </div>

      {mode === 'EXCEL' ? (
        <SectionCard
          title="Precargar desde Excel"
          description="El archivo se procesa dentro de este navegador; primero verás una vista previa editable."
          action={<FileSpreadsheet className="size-5 text-emerald-700" aria-hidden="true" />}
        >
          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_18rem_auto] lg:items-end">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Archivo de producción
              </span>
              <span className="relative block">
                <Upload className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-brand-700" aria-hidden="true" />
                <input
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="block h-10 w-full cursor-pointer rounded-lg border border-dashed border-brand-300 bg-brand-50 pl-9 text-xs font-semibold text-brand-900 file:mr-3 file:h-10 file:border-0 file:border-r file:border-brand-200 file:bg-transparent file:px-3 file:text-xs file:font-bold file:text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-300"
                  aria-describedby="excel-file-status"
                  onChange={handleWorkbook}
                />
              </span>
              <span id="excel-file-status" className="mt-1 block truncate text-[0.6875rem] text-slate-500">
                {fileName || 'Solo archivos .xlsx con hojas diarias del formato TRABUNDA.'}
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Hoja diaria
              </span>
              <select
                value={selectedSheetName}
                disabled={parsedSheets.length === 0}
                onChange={(event) => setSelectedSheetName(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 disabled:bg-slate-100"
              >
                {parsedSheets.length === 0 ? <option>Sin hojas detectadas</option> : null}
                {parsedSheets.map((sheet) => (
                  <option key={`${sheet.sheetName}-${sheet.date}`} value={sheet.sheetName}>
                    {sheet.sheetName} · {sheet.date}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={importState !== 'READY'}
              onClick={applyImportedSheet}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 text-sm font-bold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Cargar vista previa
            </button>
          </div>
          {importState === 'READING' ? (
            <p className="px-5 pb-4 text-xs font-semibold text-brand-800" role="status">
              Leyendo y validando el libro…
            </p>
          ) : null}
          {importState === 'ERROR' ? (
            <p className="mx-5 mb-5 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800" role="alert">
              No se pudo leer una hoja diaria válida. Verifica que sea el formato de producción `.xlsx`.
            </p>
          ) : null}
        </SectionCard>
      ) : null}

      {mode === 'SCREENSHOT' ? (
        <SectionCard
          title="Cargar captura de producción"
          description="Sube una captura por turno. La lectura se realiza en este navegador y siempre se revisa antes de guardar."
          action={<ImagePlus className="size-5 text-brand-700" aria-hidden="true" />}
        >
          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[14rem_1fr] lg:items-end">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Turno de esta captura
              </span>
              <select
                value={screenshotShift}
                onChange={(event) => setScreenshotShift(event.target.value as 'DAY' | 'NIGHT')}
                className="h-10 w-full rounded-lg border border-[#2B5268] bg-[#07141F] px-3 text-sm font-semibold text-[#F3F8FB] focus:border-[#169FD0]"
              >
                <option value="DAY">Turno Día</option>
                <option value="NIGHT">Turno Noche</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Imagen del reporte
              </span>
              <span className="relative block">
                <Upload className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-brand-700" aria-hidden="true" />
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="block h-10 w-full cursor-pointer rounded-lg border border-dashed border-[#2B5268] bg-[#07141F] pl-9 text-xs font-semibold text-[#F3F8FB] file:mr-3 file:h-10 file:border-0 file:border-r file:border-[#2B5268] file:bg-transparent file:px-3 file:text-xs file:font-bold file:text-[#58C8EA] focus:outline-none focus:ring-2 focus:ring-[#169FD0]"
                  onChange={handleScreenshot}
                />
              </span>
              <span className="mt-1 block truncate text-[0.6875rem] text-slate-500">
                {fileName || 'PNG, JPG o WEBP. Sube primero un turno y luego el otro.'}
              </span>
            </label>
          </div>
          {importState === 'READING' ? (
            <p className="px-5 pb-4 text-xs font-semibold text-brand-800" role="status">
              Leyendo la captura y detectando productos…
            </p>
          ) : null}
          {screenshotWarnings.length > 0 ? (
            <div className="mx-5 mb-5 rounded-lg border border-[#805f22] bg-[#2a2414] px-3 py-2 text-xs leading-5 text-[#f2c866]" role="status">
              {screenshotWarnings.map((warning) => <p key={warning}>{warning}</p>)}
            </div>
          ) : null}
          {captureSummary ? (
            <div className="mx-5 mb-5 grid gap-2 rounded-lg border border-[#203E50] bg-[#07141F] p-3 text-xs sm:grid-cols-4" role="region" aria-label="Validación de captura">
              <div><p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-[#7F9BAD]">Total captura KG</p><p className="number-tabular mt-1 font-bold text-[#F3F8FB]">{captureSummary.sourceGrandTotalKg === null ? 'No confirmado' : formatCentiKg(captureQuantityKg100(String(captureSummary.sourceGrandTotalKg)))}</p></div>
              <div><p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-[#7F9BAD]">Total jornada KG</p><p className="number-tabular mt-1 font-bold text-[#F3F8FB]">{formatCentiKg(captureQuantityKg100(String(captureSummary.selectedDateTotalKg)))}</p></div>
              <div><p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-[#7F9BAD]">Total reconstruido KG</p><p className="number-tabular mt-1 font-bold text-[#F3F8FB]">{formatCentiKg(captureQuantityKg100(String(captureSummary.reconstructedGrandTotalKg)))}</p></div>
              <div><p className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-[#7F9BAD]">Estado</p><p className={`mt-1 font-extrabold ${captureSummary.sourceGrandTotalKg !== null && captureSummary.sourceGrandTotalKg === captureSummary.reconstructedGrandTotalKg ? 'text-[#32D094]' : 'text-[#E4AC35]'}`}>{captureSummary.sourceGrandTotalKg !== null && captureSummary.sourceGrandTotalKg === captureSummary.reconstructedGrandTotalKg ? 'CAPTURA RECONCILIADA' : 'CAPTURA REQUIERE REVISIÓN'}</p></div>
            </div>
          ) : null}
          {otherDateRows.length > 0 ? (
            <div className="mx-5 mb-5 rounded-lg border border-[#805f22] bg-[#2a2414] px-4 py-3" role="region" aria-label="Otras fechas detectadas">
              <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#E4AC35]">Otra fecha detectada</p>
              <p className="mt-1 text-xs leading-5 text-[#A5BED0]">Estas filas no se aplicaron a la jornada seleccionada.</p>
              {otherDateRows.map((row, index) => (
                <p key={`${row.product.productId}-${row.date}-${index}`} className="mt-2 text-xs text-[#F3F8FB]">
                  {row.product.productName} · {row.date ?? 'Fecha no confirmada'} · {formatCentiKg(captureQuantityKg100(String(row.totalKg)))}
                </p>
              ))}
            </div>
          ) : null}
          {pendingProducts.length > 0 ? (
            <div className="mx-5 mb-5 rounded-lg border border-[#2B5268] bg-[#0D2534] px-4 py-3" role="region" aria-label="Productos detectados">
              <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#F3F8FB]">
                Productos detectados
              </p>
              <p className="mt-1 text-xs leading-5 text-[#A5BED0]">
                Confirma cada producto antes de incorporarlo al catálogo activo.
              </p>
              <div className="mt-3 space-y-2">
                {pendingProducts.map((product) => (
                  <div key={product.productId} className="flex flex-col gap-3 rounded-lg border border-[#2B5268] bg-[#123247] p-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.08em] text-[#58C8EA]">NUEVO PRODUCTO</p>
                        <span className="rounded-md border border-[#2B5268] px-2 py-1 text-[0.625rem] font-bold text-[#A5BED0]">TOTAL KG: {formatCentiKg(sumKg100(draft.rows.filter((row) => row.product.productId === product.productId).map((row) => captureQuantityKg100(screenshotShift === 'DAY' ? row.dayReportedKg : row.nightReportedKg))))}</span>
                      </div>
                      <label className="mt-2 block text-[0.6875rem] font-bold text-[#A5BED0]">
                        Descripción
                        <input
                          value={product.canonicalName ?? product.productName}
                          onChange={(event) => updatePendingProduct(product.productId, 'canonicalName', event.target.value)}
                          className="mt-1 h-9 w-full min-w-0 rounded-lg border border-[#2B5268] bg-[#07141F] px-2 text-xs text-[#F3F8FB] placeholder:text-[#7F9BAD] focus:border-[#169FD0] sm:w-[34rem]"
                        />
                      </label>
                      <label className="mt-2 block text-[0.6875rem] font-bold text-[#A5BED0]">
                        Familia
                        <select
                          value={product.familyId}
                          onChange={(event) => {
                            const family = event.target.value
                            const metadata: Record<string, [string, string]> = {
                              'aleta-cruda': ['ALETA CRUDA', 'ALETA'],
                              'manto-crudo': ['MANTO CRUDO', 'MANTO'],
                              anillas: ['ANILLAS', 'ANILLAS'],
                              'nuca-semilimpia': ['NUCA SEMILIMPIA', 'NUCA_SEMILIMPIA'],
                              'rejos-crudo': ['REJOS CRUDO', 'REJOS'],
                              'reproductor-crudo': ['REPRODUCTOR CRUDO', 'REPRODUCTOR'],
                              'recorte-crudo': ['RECORTE CRUDO', 'RECORTE_CRUDO'],
                            }
                            const [familyName, summaryGroupId] = metadata[family] ?? ['PRODUCTO IMPORTADO', 'MANTO']
                            updatePendingProduct(product.productId, 'familyId', family)
                            updatePendingProduct(product.productId, 'familyName', familyName)
                            updatePendingProduct(product.productId, 'summaryGroupId', summaryGroupId)
                          }}
                          className="mt-1 h-9 w-full rounded-lg border border-[#2B5268] bg-[#07141F] px-2 text-xs text-[#F3F8FB] focus:border-[#169FD0] sm:w-64"
                        >
                          <option value="aleta-cruda">ALETA CRUDA</option>
                          <option value="manto-crudo">MANTO CRUDO</option>
                          <option value="anillas">ANILLAS</option>
                          <option value="nuca-semilimpia">NUCA SEMILIMPIA</option>
                          <option value="rejos-crudo">REJOS CRUDO</option>
                          <option value="reproductor-crudo">REPRODUCTOR CRUDO</option>
                          <option value="recorte-crudo">RECORTE CRUDO</option>
                        </select>
                      </label>
                      {product.familyId === 'anillas' ? (
                        <label className="mt-2 block text-[0.6875rem] font-bold text-[#A5BED0]">
                          Clasificación técnica
                          <select
                            value={product.technicalClassification ?? 'UNCLASSIFIED'}
                            onChange={(event) => updatePendingProduct(product.productId, 'technicalClassification', event.target.value)}
                            className="mt-1 h-9 w-full rounded-lg border border-[#2B5268] bg-[#07141F] px-2 text-xs text-[#F3F8FB] focus:border-[#169FD0] sm:w-64"
                          >
                            <option value="UNCLASSIFIED">REQUIERE CLASIFICACIÓN TÉCNICA</option>
                            <option value="POLAR">POLAR · 36%</option>
                            <option value="USA">USA · 34%</option>
                            <option value="GENERAL">GENERAL · 42%</option>
                          </select>
                        </label>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg bg-[#169FD0] px-3 text-xs font-bold text-white hover:bg-[#58C8EA] hover:text-[#07141F]"
                      onClick={() => {
                        const confirmedProduct = confirmProductionCatalogItem(product)

                        setCatalogItems((current) => {
                          const alreadyExists = current.some(
                            (candidate) =>
                              candidate.productId === confirmedProduct.productId,
                          )
                        
                          if (alreadyExists) {
                            return current
                          }
                        
                          return [...current, confirmedProduct]
                        })
                      
                        setPendingProducts((current) =>
                          current.filter(
                            (candidate) => candidate.productId !== product.productId,
                          ),
                        )
                      }}
                    >
                      Agregar al catálogo
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="mt-3 text-xs font-bold text-[#7F9BAD] underline hover:text-[#F3F8FB]"
                onClick={() => setPendingProducts([])}
              >
                Ignorar productos nuevos
              </button>
            </div>
          ) : null}
          {possibleMatches.length > 0 ? (
            <div className="mx-5 mb-5 rounded-lg border border-[#805f22] bg-[#2a2414] px-4 py-3" role="region" aria-label="Posibles coincidencias">
              <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#E4AC35]">Revisar coincidencia</p>
              <p className="mt-1 text-xs leading-5 text-[#A5BED0]">Confirma si la variante OCR corresponde al producto existente.</p>
              {possibleMatches.map((candidate) => (
                <div key={candidate.sourceText} className="mt-3 flex flex-col gap-2 rounded-lg border border-[#805f22] bg-[#123247] p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 text-xs text-[#A5BED0]">
                    <p><span className="font-bold text-[#7F9BAD]">Texto detectado:</span> {candidate.sourceText}</p>
                    <p className="mt-1"><span className="font-bold text-[#7F9BAD]">Coincidencia:</span> <strong className="text-[#F3F8FB]">{candidate.product.canonicalName ?? candidate.product.productName}</strong></p>
                    <p className="mt-1 text-[0.6875rem]">Fecha: {candidate.date ?? 'No confirmada'} · Total KG: {formatCentiKg(captureQuantityKg100(String(candidate.totalKg)))}</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg bg-[#E4AC35] px-3 text-xs font-bold text-[#07141F] hover:bg-[#f2c866]"
                    onClick={() => {
                      addAliasToActiveProduct(candidate.product.productId, candidate.sourceText)
                      setPossibleMatches((current) => current.filter((item) => item.sourceText !== candidate.sourceText))
                    }}
                  >
                    Usar existente y guardar alias
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          {mode === 'SCREENSHOT' && draft.rows.length > 0 ? (
            <p className="border-t border-[#203E50] bg-[#0D2534] px-5 py-3 text-xs font-semibold leading-5 text-[#A5BED0]">
              Captura acumulada. Puedes subir la imagen del otro turno y los productos se combinarán por producto. Los productos nuevos se agregan al catálogo local para futuras capturas.
            </p>
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard
        title="Datos generales"
        description={
          draft.source === 'EXCEL' || draft.source === 'SCREENSHOT'
            ? `Vista previa de ${draft.source === 'SCREENSHOT' ? 'las capturas cargadas' : draft.sourceSheet}; todos los campos siguen siendo editables antes de guardar.`
            : 'Totales independientes usados para validar el cuadre y el aprovechamiento.'
        }
      >
        {isSunday ? (
          <div className="border-b border-brand-200 bg-brand-50 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-brand-900">
                  DOMINGO · {isFreezing
                    ? 'CONGELAMIENTO DE PENDIENTES'
                    : isBalanceOnly
                      ? 'PROCESAMIENTO DE SALDOS'
                      : 'PRODUCCIÓN NORMAL'}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {isFreezing
                    ? 'Los kg congelados se descuentan de la disponibilidad pendiente y conservan la jornada de Envasado que los originó.'
                    : 'Por defecto el domingo no registra nueva descarga. Los kg procesados se descuentan de saldos pendientes de jornadas anteriores.'}
                </p>
              </div>
              {!isFreezing ? (
              <label className="flex shrink-0 items-start gap-2.5 rounded-lg border border-brand-200 bg-white px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={!isBalanceOnly}
                  onChange={(event) =>
                    updateDraft(
                      'operationMode',
                      event.target.checked ? 'NORMAL' : 'BALANCE_ONLY',
                    )
                  }
                  className="mt-0.5 size-4 rounded border-slate-300 text-brand-700"
                />
                <span className="text-xs font-bold text-slate-800">
                  Hubo descarga / producción nueva el domingo
                </span>
              </label>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className={`grid gap-4 p-4 sm:grid-cols-2 sm:p-5 ${isFreezing ? 'xl:grid-cols-4' : 'xl:grid-cols-5'}`}>
          <label className="block">
            <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
              Fecha
            </span>
            <input
              type="date"
              value={draft.date}
              min={editingDate ? existingDay?.date : activeWeek.period.startDate}
              max={editingDate ? existingDay?.date : activeWeek.period.endDate}
              disabled={Boolean(existingDay)}
              onChange={(event) => updateDate(event.target.value)}
              className="number-tabular h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            />
          </label>
          {!isFreezing ? (
            <QuantityInput
              label="Materia prima"
              value={usesExternalAvailability ? '0' : draft.rawMaterialKg}
              disabled={usesExternalAvailability}
              onChange={(value) => updateDraft('rawMaterialKg', value)}
            />
          ) : null}
          <QuantityInput label="Reporte Día" value={draft.declaredDayTotalKg} onChange={(value) => updateDraft('declaredDayTotalKg', value)} />
          <QuantityInput label="Reporte Noche" value={draft.declaredNightTotalKg} onChange={(value) => updateDraft('declaredNightTotalKg', value)} />
          <div>
            <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
              {isFreezing ? 'Total congelado' : 'Total reportado'}
            </span>
            <div className="number-tabular flex h-10 items-center justify-end rounded-lg border border-brand-200 bg-brand-50 px-3 text-sm font-extrabold text-brand-900">
              {formatCentiKg(totalReportedKg100)}
            </div>
          </div>
        </div>
        {!usesExternalAvailability ? (
        <div className="grid gap-4 border-t border-slate-200 px-4 py-3 sm:px-5 lg:grid-cols-2">
          <div>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={draft.nucaWashConfirmed}
                onChange={(event) => updateDraft('nucaWashConfirmed', event.target.checked)}
                className="mt-0.5 size-4 rounded border-slate-300 text-brand-700"
              />
              <span>
                <span className="block text-xs font-bold text-slate-800">
                  Existe pedido confirmado para lavado de Nuca Bikini
                </span>
                <span className="mt-0.5 block text-[0.6875rem] leading-4 text-slate-500">
                  Márcalo solo cuando corresponda; no afecta el cuadre de otros productos.
                </span>
              </span>
            </label>
            {draft.nucaWashConfirmed ? (
              <label className="mt-3 block max-w-sm">
                <span className="mb-1 block text-xs font-bold text-slate-700">
                  Referencia del pedido (opcional)
                </span>
                <input
                  type="text"
                  value={draft.nucaWashReference}
                  onChange={(event) => updateDraft('nucaWashReference', event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </label>
            ) : null}
          </div>
          <div>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                aria-label="Existe producto para Túnel"
                checked={draft.hasTunnelProduction}
                onChange={(event) => updateTunnelCondition(event.target.checked)}
                className="mt-0.5 size-4 rounded border-slate-300 text-brand-700"
              />
              <span>
                <span className="block text-xs font-bold text-slate-800">
                  Existe producto para Túnel
                </span>
                <span className="mt-0.5 block text-[0.6875rem] leading-4 text-slate-500">
                  Activa la etapa solo cuando existan movimientos reales de Túnel.
                </span>
              </span>
            </label>
            {tunnelToggleError ? (
              <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900" role="alert">
                {tunnelToggleError}
              </p>
            ) : null}
          </div>
        </div>
        ) : (
          <p className="border-t border-brand-200 bg-brand-50/60 px-4 py-3 text-xs font-semibold text-brand-900 sm:px-5">
            {isFreezing
              ? 'Congelamiento no recibe nueva MP anatómica. La validación usa reportes físicos y disponibilidad trazable desde Envasado.'
              : 'Materia Prima fija en 0 kg. La validación se realizará con los reportes físicos y los saldos vinculados por turno.'}
          </p>
        )}
      </SectionCard>

      {draft.importedBalances.length > 0 ? (
        <div className={`rounded-xl border px-4 py-3 ${importedBalanceMatches ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900">
                Saldos detectados en el Excel: {formatCentiKg(importedBalanceTotal)}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Asígnalos en la columna “Saldo final” del producto correspondiente. Asignado ahora: {formatCentiKg(buildResult.calculation.newClosingBalanceKg100)}.
              </p>
              <p className="mt-1 text-[0.6875rem] font-semibold text-slate-500">
                {draft.importedBalances.map((balance) => `${balance.label}: ${balance.kg.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`).join(' · ')}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <SectionCard
        title="Reportes Día / Noche"
        description={
          draft.shiftAllocationMode === 'EXPLICIT'
            ? 'Registra los productos informados por los supervisores y concilia cada turno.'
            : 'Día y Noche se distribuyen desde los totales del Excel y conservan su trazabilidad.'
        }
        action={
          <StatusBadge tone={draft.shiftAllocationMode === 'EXPLICIT' ? 'info' : 'warning'}>
            {draft.shiftAllocationMode === 'EXPLICIT' ? 'TURNOS EXPLÍCITOS' : 'REPARTO CONCILIADO'}
          </StatusBadge>
        }
      >
        <div className="grid gap-3 border-b border-slate-200 bg-slate-50/55 p-4 sm:grid-cols-2 sm:p-5">
          {([
            ['Día', buildResult.calculation.day, dayHasReportData],
            ['Noche', buildResult.calculation.night, nightHasReportData],
          ] as const).map(([label, shift, hasShiftData]) => (
            <article
              key={label}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-950">Turno {label}</h3>
                <StatusBadge
                  tone={hasShiftData && shift.detailDifferenceKg100 === 0 ? 'success' : 'warning'}
                >
                  {hasShiftData && shift.detailDifferenceKg100 === 0 ? 'CONCILIADO' : 'PENDIENTE'}
                </StatusBadge>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <dt className="text-slate-500">Reporte supervisor</dt>
                  <dd className="number-tabular mt-1 font-bold text-slate-900">
                    {hasShiftData ? formatCentiKg(shift.declaredReportedKg100) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Productos registrados</dt>
                  <dd className="number-tabular mt-1 font-bold text-slate-900">
                    {hasShiftData ? formatCentiKg(shift.reportedKg100) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Diferencia</dt>
                  <dd
                    className={`number-tabular mt-1 font-extrabold ${
                      hasShiftData && shift.detailDifferenceKg100 === 0
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}
                  >
                    {hasShiftData ? formatCentiKg(shift.detailDifferenceKg100) : '—'}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs font-semibold text-slate-600">
                {hasShiftData
                  ? shiftDifferenceMessage(label, shift.detailDifferenceKg100)
                  : `Completa el reporte del Turno ${label}.`}
              </p>
            </article>
          ))}
        </div>

        {mode === 'MANUAL' ? (
          <div className="grid gap-3 border-b border-slate-200 p-4 sm:p-5 lg:grid-cols-[minmax(13rem,0.7fr)_minmax(24rem,1.3fr)_auto] lg:items-end">
            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Buscar producto
              </span>
              <span className="relative block">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={productSearch}
                  placeholder="Ej.: aleta, manto o nuca"
                  autoComplete="off"
                  onChange={(event) => {
                    setProductSearch(event.target.value)
                    setSelectedProductId('')
                  }}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </span>
            </label>
            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Producto con movimiento
              </span>
              <select
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-brand-400"
              >
                <option value="">
                  {filteredCatalogItems.length === 0
                    ? 'Sin productos coincidentes'
                    : `Seleccionar entre ${filteredCatalogItems.length} producto${filteredCatalogItems.length === 1 ? '' : 's'} detectado${filteredCatalogItems.length === 1 ? '' : 's'}…`}
                </option>
                {filteredCatalogItems.map((product) => (
                  <option key={product.productId} value={product.productId}>
                    {product.familyName} · {product.productName}
                    {isFreezing
                      ? ` · Disponible: ${formatCentiKg(
                          freezingAvailabilityByProduct.get(product.productId) ??
                            kg100(0),
                        )}`
                      : ''}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={addSelectedProduct}
              disabled={!selectedProductId}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 text-sm font-bold text-brand-900 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              Agregar
            </button>
          </div>
        ) : null}

        {draft.rows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            Carga una captura de producción para construir la lista de productos de esta jornada.
          </div>
        ) : (
          <DataTableScroll label="Captura por producto y turno">
            <table className="erp-table w-full min-w-[76rem] border-collapse text-left">
              <caption className="sr-only">Ingreso de producción por producto</caption>
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
                  <th className="sticky left-0 z-20 w-[24rem] bg-slate-50 px-4 py-2.5">Familia / producto</th>
                  <th className="px-2 py-2.5 text-right">Día reportado</th>
                  <th className="px-2 py-2.5 text-right">Noche reportado</th>
                  <th className="px-3 py-2.5 text-right">Total jornada</th>
                  <th className="px-3 py-2.5 text-right">
                    {isFreezing ? 'Disponible' : 'Rend. preliminar'}
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    {isFreezing ? 'Pendiente' : 'Objetivo'}
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    {isFreezing ? 'Diferencia' : 'Kg faltantes'}
                  </th>
                  <th className="px-3 py-2.5 text-center">Estado</th>
                  <th className="px-3 py-2.5"><span className="sr-only">Eliminar</span></th>
                </tr>
              </thead>
              <tbody>
                {reportFamilySubtotals.map((subtotal) => {
                  const familyAvailability = subtotal.productIds.reduce(
                    (total, productId) => {
                      const availability = captureProductAvailability(
                        draft,
                        productId,
                      )
                      return {
                        availableKg100: kg100(
                          total.availableKg100 + availability.availableKg100,
                        ),
                        frozenKg100: kg100(
                          total.frozenKg100 + availability.frozenKg100,
                        ),
                        pendingKg100: kg100(
                          total.pendingKg100 + availability.pendingKg100,
                        ),
                      }
                    },
                    {
                      availableKg100: kg100(0),
                      frozenKg100: kg100(0),
                      pendingKg100: kg100(0),
                    },
                  )
                  const familyDifferenceKg100 = kg100(
                    subtotal.totalKg100 - familyAvailability.frozenKg100,
                  )

                  return (
                  <Fragment key={subtotal.key}>
                    <tr className="border-b border-brand-100 bg-brand-50/45">
                      <th colSpan={9} className="sticky left-0 z-10 px-4 py-2 text-[0.6875rem] font-extrabold uppercase tracking-[0.08em] text-brand-800">
                        {subtotal.label}
                      </th>
                    </tr>
                    {subtotal.productIds.map((productId) => {
                      const row = draft.rows.find(
                        (candidate) => candidate.product.productId === productId,
                      )!
                      const calculated = buildResult.calculation.products.find(
                        (candidate) => candidate.productId === productId,
                      )
                      const inferred = draft.shiftAllocationMode === 'RECONCILED_INFERENCE'
                      const totalKg100 = sumKg100([
                        calculated?.day.reportedKg100 ?? kg100(0),
                        calculated?.night.reportedKg100 ?? kg100(0),
                      ])
                      const availability = captureProductAvailability(
                        draft,
                        productId,
                      )
                      const linkedDifferenceKg100 = kg100(
                        totalKg100 - availability.frozenKg100,
                      )
                      return (
                    <tr key={row.key} className="border-b border-slate-100 bg-white hover:bg-brand-50/25">
                      <th className="sticky left-0 z-10 bg-white px-4 py-2.5">
                        <span className="block text-[0.625rem] font-bold uppercase tracking-[0.06em] text-brand-700">{row.product.familyName}</span>
                        <span className="mt-0.5 block max-w-[22rem] text-xs font-semibold leading-4 text-slate-800">{row.product.productName}</span>
                      </th>
                      <td className="w-36 px-2 py-2">
                        <QuantityInput label="" value={inferred ? String((calculated?.day.reportedKg100 ?? 0) / 100) : row.dayReportedKg} readOnly={inferred} onChange={(value) => updateRow(row.key, 'dayReportedKg', value)} />
                      </td>
                      <td className="w-36 px-2 py-2">
                        <QuantityInput label="" value={inferred ? String((calculated?.night.reportedKg100 ?? 0) / 100) : row.nightReportedKg} readOnly={inferred} onChange={(value) => updateRow(row.key, 'nightReportedKg', value)} />
                      </td>
                      <td className="number-tabular px-3 py-2.5 text-right text-xs font-bold text-slate-800">
                        {formatCentiKg(totalKg100)}
                      </td>
                      <td className="number-tabular px-3 py-2.5 text-right text-xs text-slate-700">
                        {isFreezing ? formatCentiKg(availability.availableKg100) : '—'}
                      </td>
                      <td className="number-tabular px-3 py-2.5 text-right text-xs text-slate-700">
                        {isFreezing ? formatCentiKg(availability.pendingKg100) : '—'}
                      </td>
                      <td className={`number-tabular px-3 py-2.5 text-right text-xs ${isFreezing && linkedDifferenceKg100 !== 0 ? 'font-bold text-rose-700' : 'text-slate-400'}`}>
                        {isFreezing ? formatCentiKg(linkedDifferenceKg100) : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs text-slate-400">
                        {isFreezing ? (
                          <StatusBadge tone={linkedDifferenceKg100 === 0 ? 'success' : 'danger'}>
                            {availability.availableKg100 === 0
                              ? 'SIN DISPONIBILIDAD'
                              : linkedDifferenceKg100 === 0
                                ? 'TRAZABLE'
                                : 'REVISAR'}
                          </StatusBadge>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        <button type="button" className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-700" aria-label={`Eliminar ${row.product.productName}`} onClick={() => removeRow(row.key)}>
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                      )
                    })}
                    <tr className="border-b border-slate-200 bg-slate-50/80 font-bold">
                      <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-xs uppercase text-slate-800">
                        Subtotal {subtotal.label}
                      </th>
                      <td className="number-tabular px-3 py-3 text-right text-xs text-slate-800">{formatCentiKg(subtotal.dayKg100)}</td>
                      <td className="number-tabular px-3 py-3 text-right text-xs text-slate-800">{formatCentiKg(subtotal.nightKg100)}</td>
                      <td className="number-tabular px-3 py-3 text-right text-xs text-slate-950">{formatCentiKg(subtotal.totalKg100)}</td>
                      <td className="number-tabular px-3 py-3 text-right text-xs text-slate-950">
                        {isFreezing
                          ? formatCentiKg(familyAvailability.availableKg100)
                          : isBalanceOnly
                            ? 'No aplica'
                          : subtotal.preliminaryYieldPercent === null
                            ? 'No disponible'
                            : `${subtotal.preliminaryYieldPercent.toFixed(2)}%`}
                      </td>
                      <td className="number-tabular px-3 py-3 text-right text-xs text-slate-700">
                        {isFreezing
                          ? formatCentiKg(familyAvailability.pendingKg100)
                          : isBalanceOnly
                            ? 'No aplica'
                          : subtotal.targetPercent === null
                            ? 'Sin objetivo'
                            : `≥ ${subtotal.targetPercent.toFixed(0)}%`}
                      </td>
                      <td className="number-tabular px-3 py-3 text-right text-xs text-slate-700">
                        {isFreezing
                          ? formatCentiKg(familyDifferenceKg100)
                          : isBalanceOnly || subtotal.targetPercent === null
                            ? '—'
                          : formatCentiKg(subtotal.missingToTargetKg100)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <StatusBadge tone={isFreezing ? familyDifferenceKg100 === 0 ? 'success' : 'danger' : isBalanceOnly ? 'neutral' : subtotal.status === 'INTEGRITY_ERROR' ? 'danger' : subtotal.status === 'BELOW_TARGET' ? 'warning' : subtotal.status === 'COMPLIES' ? 'success' : 'neutral'}>
                          {isFreezing ? familyDifferenceKg100 === 0 ? 'TRAZABLE' : 'REVISAR' : isBalanceOnly ? 'NO APLICA' : subtotal.status === 'INTEGRITY_ERROR' ? 'ERROR' : subtotal.status === 'BELOW_TARGET' ? 'BAJO OBJETIVO' : subtotal.status === 'COMPLIES' ? 'CUMPLE' : 'SIN OBJETIVO'}
                        </StatusBadge>
                      </td>
                      <td />
                    </tr>
                  </Fragment>
                  )
                })}
              </tbody>
            </table>
          </DataTableScroll>
        )}
      </SectionCard>

      {!usesExternalAvailability && draft.hasTunnelProduction ? (
      <SectionCard
        title="Túnel"
        description="Registra producción adicional por turno sin mezclarla con los reportes del supervisor."
        action={
          <StatusBadge tone={reportsReconciled ? 'success' : 'warning'}>
            {reportsReconciled ? 'TÚNEL DISPONIBLE' : 'TÚNEL ESPERANDO CUADRE'}
          </StatusBadge>
        }
      >
        {tunnelMovementRequired ? (
          <p
            role="alert"
            className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-900 sm:px-5"
          >
            Se indicó que existe producto para Túnel, pero no se registraron productos.
          </p>
        ) : null}
        <fieldset disabled={!reportsReconciled} className="disabled:opacity-65">
          <legend className="sr-only">Registro de producción de Túnel</legend>
          <div className="grid gap-3 border-b border-slate-200 bg-slate-50/55 p-4 sm:grid-cols-3 sm:p-5">
            <MetricCard label="Túnel Día" value={formatCentiKg(buildResult.calculation.tunnel.dayKg100)} />
            <MetricCard label="Túnel Noche" value={formatCentiKg(buildResult.calculation.tunnel.nightKg100)} />
            <MetricCard label="Total Túnel" value={formatCentiKg(buildResult.calculation.tunnel.totalKg100)} tone="brand" />
          </div>
          <div className="grid gap-3 border-b border-slate-200 p-4 sm:p-5 lg:grid-cols-[minmax(13rem,0.7fr)_minmax(24rem,1.3fr)_auto] lg:items-end">
            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Buscar producto de Túnel
              </span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={tunnelSearch}
                  placeholder="Ej.: manto, nuca o anillas"
                  autoComplete="off"
                  onChange={(event) => {
                    setTunnelSearch(event.target.value)
                    setSelectedTunnelProductId('')
                  }}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </span>
            </label>
            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Producto exacto del catálogo
              </span>
              <select
                value={selectedTunnelProductId}
                onChange={(event) => setSelectedTunnelProductId(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-brand-400"
              >
                <option value="">
                  {tunnelCatalogItems.length === 0
                    ? 'No hay productos nuevos para agregar'
                    : `Seleccionar entre ${tunnelCatalogItems.length} resultados…`}
                </option>
                {tunnelCatalogItems.map((product) => (
                  <option key={product.productId} value={product.productId}>
                    {product.familyName} · {product.productName}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!selectedTunnelProductId}
              onClick={() => {
                const productId = selectedTunnelProductId

                if (!productId) return

                addMovementProduct(productId, () => {
                  setTunnelProductIds((current) => {
                    const next = new Set(current)
                    next.add(productId)
                    return next
                  })
                
                  setTunnelSearch('')
                  setSelectedTunnelProductId('')
                })
              }}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 text-sm font-bold text-brand-900 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              Agregar a Túnel
            </button>
          </div>

          {tunnelRows.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              No hay productos de Túnel registrados.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {tunnelRows.map((row) => {
                const tunnelTotalKg100 = sumKg100([
                  captureQuantityKg100(row.tunnelDayKg),
                  captureQuantityKg100(row.tunnelNightKg),
                ])

                return (
                  <div
                    key={`tunnel-${row.key}`}
                    className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_9rem_9rem_8rem] sm:items-end sm:px-5"
                  >
                    <div className="min-w-0 sm:self-center">
                      <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-brand-700">
                        {row.product.familyName}
                      </p>
                      <p className="mt-0.5 truncate text-xs font-semibold text-slate-800" title={row.product.productName}>
                        {row.product.productName}
                      </p>
                    </div>
                    <QuantityInput
                      label="Kg Día"
                      value={row.tunnelDayKg}
                      disabled={!reportsReconciled}
                      onChange={(value) => updateRow(row.key, 'tunnelDayKg', value)}
                    />
                    <QuantityInput
                      label="Kg Noche"
                      value={row.tunnelNightKg}
                      disabled={!reportsReconciled}
                      onChange={(value) => updateRow(row.key, 'tunnelNightKg', value)}
                    />
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:min-h-10">
                      <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500">Total</p>
                      <p className="number-tabular mt-0.5 text-right text-xs font-extrabold text-slate-900">
                        {formatCentiKg(tunnelTotalKg100)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </fieldset>
      </SectionCard>
      ) : null}

      {!usesExternalAvailability ? (
      <SectionCard
        title="Tratamiento"
        description="Registra movimientos de tratamiento de forma independiente al reporte de los turnos."
        action={
          <StatusBadge tone={reportsReconciled ? 'success' : 'warning'}>
            {reportsReconciled ? 'DISPONIBLE' : 'ESPERANDO CUADRE DE TURNOS'}
          </StatusBadge>
        }
      >
        <fieldset disabled={!reportsReconciled} className="disabled:opacity-65">
          <legend className="sr-only">Registro de tratamiento</legend>
          <div className="grid gap-3 border-b border-slate-200 p-4 sm:p-5 lg:grid-cols-[minmax(13rem,0.7fr)_minmax(24rem,1.3fr)_auto] lg:items-end">
            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Buscar producto de tratamiento
              </span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={treatmentSearch}
                  placeholder="Ej.: aleta, manto o nuca"
                  autoComplete="off"
                  onChange={(event) => {
                    setTreatmentSearch(event.target.value)
                    setSelectedTreatmentProductId('')
                  }}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </span>
            </label>
            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Producto exacto del catálogo
              </span>
              <select
                value={selectedTreatmentProductId}
                onChange={(event) => setSelectedTreatmentProductId(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-brand-400"
              >
                <option value="">Seleccionar producto…</option>
                {treatmentCatalogItems.map((product) => (
                  <option key={product.productId} value={product.productId}>
                    {product.familyName} · {product.productName}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!selectedTreatmentProductId}
              onClick={() => {
              const productId = selectedTreatmentProductId

              if (!productId) return

              addMovementProduct(productId, () => {
                setTreatmentProductIds((current) => {
                  const next = new Set(current)
                  next.add(productId)
                  return next
                })
              
                setTreatmentSearch('')
                setSelectedTreatmentProductId('')
              })
            }}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 text-sm font-bold text-brand-900 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              Agregar tratamiento
            </button>
          </div>

          {treatmentRows.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
            No hay productos de tratamiento registrados.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {treatmentRows.map((row) => (
            <div
              key={`treatment-${row.key}`}
              className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_10rem_2.5rem] sm:items-end sm:px-5"
            >
              <div className="min-w-0 sm:self-center">
                <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-brand-700">
                  {row.product.familyName}
                </p>

                <p
                  className="mt-0.5 truncate text-xs font-semibold text-slate-800"
                  title={row.product.productName}
                >
                  {row.product.productName}
                </p>
              </div>

              <QuantityInput
                label="Kg tratamiento"
                value={row.treatmentKg}
                disabled={!reportsReconciled}
                onChange={(value) =>
                  updateRow(row.key, 'treatmentKg', value)
                }
              />

              <button
                type="button"
                onClick={() => removeTreatmentProduct(row.key)}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                aria-label={`Eliminar tratamiento de ${row.product.productName}`}
                title="Eliminar de tratamiento"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          ))}
            </div>
          )}
        </fieldset>
      </SectionCard>
      ) : null}

      <SectionCard
        title={isFreezing ? 'Disponibilidad para congelar' : 'Saldos anteriores procesados'}
        description={
          isFreezing
            ? 'Selecciona producto envasado pendiente de congelar y distribuye lo ejecutado entre Día y Noche.'
            : isBalanceOnly
            ? 'Fuente principal del domingo: vincula cada kg procesado con su jornada de origen y turno.'
            : 'Selecciona lotes pendientes reales y distribuye su consumo entre Día y Noche.'
        }
        action={<StatusBadge tone="info">ORIGEN TRAZABLE</StatusBadge>}
      >
        {isFreezing ? (
          <dl className="grid gap-px border-b border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-6">
            {[
              ['Disponible desde Envasado', freezingAvailableFromPackingKg100],
              ['Pendiente anterior', freezingPreviousPendingKg100],
              ['Total disponible', freezingTotalAvailableKg100],
              ['Congelado en esta jornada', freezingLinkedThisDayKg100],
              ['Pendiente posterior', freezingPendingAfterKg100],
              ['Diferencia no explicada', freezingUnexplainedDifferenceKg100],
            ].map(([label, value], index) => (
              <div key={String(label)} className="bg-white px-4 py-3 text-center">
                <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500">
                  {String(label)}
                </dt>
                <dd
                  className={`number-tabular mt-1 whitespace-nowrap text-sm font-extrabold ${
                    index === 5 && freezingUnexplainedDifferenceKg100 !== 0
                      ? 'text-rose-700'
                      : index === 4 && freezingPendingAfterKg100 > 0
                        ? 'text-amber-700'
                        : 'text-slate-950'
                  }`}
                >
                  {formatCentiKg(value as ReturnType<typeof kg100>)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        <fieldset disabled={!usesExternalAvailability && !reportsReconciled} className="disabled:opacity-65">
          <legend className="sr-only">Consumo de saldos anteriores</legend>
          <div className="grid gap-3 border-b border-slate-200 p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                {isFreezing ? 'Producto disponible para congelar' : 'Saldo pendiente disponible'}
              </span>
              <select
                value={selectedBalanceKey}
                onChange={(event) => setSelectedBalanceKey(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-brand-400"
              >
                <option value="">
                  {availableBalances.length === 0
                    ? isFreezing
                      ? 'No hay producto envasado pendiente de congelar'
                      : 'No hay otros saldos pendientes disponibles'
                    : 'Seleccionar jornada origen y producto…'}
                </option>
                {availableBalances.map((balance) => (
                  <option
                    key={`${balance.originDayId}|${balance.productId}`}
                    value={`${balance.originDayId}|${balance.productId}`}
                  >
                    {formatIsoDate(balance.originDate)} · {balance.familyName} ·{' '}
                    {balance.productName} · {formatCentiKg(balance.pendingKg100)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!selectedBalanceKey}
              onClick={addSelectedBalance}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 text-sm font-bold text-brand-900 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              {isFreezing ? 'Vincular producto' : 'Usar saldo'}
            </button>
          </div>

          {draft.balanceUses.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">
              {isFreezing
                ? 'No se ha vinculado producto disponible desde Envasado.'
                : 'No se han asignado saldos de jornadas anteriores.'}
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {draft.balanceUses.map((balance) => {
                const position = captureBalancePosition(balance)
                const requiresProductDistribution =
                  balance.requiresProductDistribution === true
                const productShiftDiagnostics = balanceShiftDiagnostics.filter(
                  (diagnostic) => diagnostic.productId === balance.productId,
                )

                return (
                  <div key={balance.key} className="px-4 py-4 sm:px-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900">
                          {balance.familyName} · {balance.productName}
                        </p>
                        <p className="mt-1 text-[0.6875rem] text-slate-500">
                          Origen: {balance.originDate ? formatIsoDate(balance.originDate) : balance.originDayId} ·
                          Disponible: {formatCentiKg(balance.availableKg100)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBalanceUse(balance.key)}
                        className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-700"
                        aria-label={`Quitar saldo de ${balance.productName}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                    {requiresProductDistribution ? (
                      <div
                        role="alert"
                        className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="text-[0.6875rem] font-extrabold uppercase tracking-[0.06em] text-amber-900">
                              Requiere distribución
                            </p>
                            <p className="mt-1 text-xs leading-5 text-amber-800">
                              Este saldo histórico solo identifica la familia. Selecciona el producto comercial exacto; el sistema no lo asignará automáticamente.
                            </p>
                          </div>
                          <label className="min-w-0 sm:w-[28rem]">
                            <span className="mb-1 block text-[0.6875rem] font-bold text-amber-900">
                              Producto exacto
                            </span>
                            <select
                              value=""
                              onChange={(event) =>
                                distributeLegacyBalance(
                                  balance.key,
                                  event.target.value,
                                )
                              }
                              className="h-10 w-full rounded-lg border border-amber-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-400"
                            >
                              <option value="">Seleccionar producto…</option>
                              {catalogItems
                                .filter(
                                  (product) =>
                                    product.familyId === balance.familyId &&
                                    product.active !== false,
                                )
                                .map((product) => (
                                <option
                                  key={product.productId}
                                  value={product.productId}
                                >
                                  {product.productName}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </div>
                    ) : null}
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500">
                          Disponible
                        </p>
                        <p className="number-tabular mt-1 text-sm font-extrabold text-slate-900">
                          {formatCentiKg(balance.availableKg100)}
                        </p>
                      </div>
                      <QuantityInput
                        label="Procesado Día"
                        value={balance.dayKg}
                        onChange={(value) => updateBalanceUse(balance.key, 'dayKg', value)}
                      />
                      <QuantityInput
                        label="Procesado Noche"
                        value={balance.nightKg}
                        onChange={(value) => updateBalanceUse(balance.key, 'nightKg', value)}
                      />
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500">
                          Total procesado
                        </p>
                        <p className="number-tabular mt-1 text-sm font-extrabold text-slate-900">
                          {formatCentiKg(position.processedKg100)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500">
                          Pendiente
                        </p>
                        <p className={`number-tabular mt-1 text-sm font-extrabold ${position.overusedKg100 > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                          {position.overusedKg100 > 0
                            ? `Exceso ${formatCentiKg(position.overusedKg100)}`
                            : formatCentiKg(position.pendingKg100)}
                        </p>
                      </div>
                      <div className="flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-2">
                        <StatusBadge
                          tone={
                            requiresProductDistribution ||
                            position.overusedKg100 > 0 ||
                            productShiftDiagnostics.length > 0
                              ? requiresProductDistribution
                                ? 'warning'
                                : 'danger'
                              : position.pendingKg100 === 0
                                ? 'success'
                                : 'warning'
                          }
                        >
                          {requiresProductDistribution
                            ? 'REQUIERE DISTRIBUCIÓN'
                            : position.overusedKg100 > 0 ||
                          productShiftDiagnostics.length > 0
                            ? 'REVISAR'
                            : position.pendingKg100 === 0
                              ? 'CONSUMIDO'
                              : 'PENDIENTE'}
                        </StatusBadge>
                      </div>
                    </div>
                    {productShiftDiagnostics.length > 0 ? (
                      <div
                        role="alert"
                        className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-rose-900"
                      >
                        <p className="text-[0.6875rem] font-extrabold uppercase tracking-[0.06em]">
                          Saldo anterior mal distribuido
                        </p>
                        {productShiftDiagnostics.map((diagnostic) => (
                          <div
                            key={`${diagnostic.productId}-${diagnostic.shift}`}
                            className="mt-2 text-xs leading-5"
                          >
                            <p className="font-bold">{diagnostic.productName} · Turno {diagnostic.shift === 'DAY' ? 'Día' : 'Noche'}</p>
                            <p>
                              Reporte físico: {formatCentiKg(diagnostic.reportedKg100)} ·
                              Saldo asignado: {formatCentiKg(diagnostic.assignedBalanceKg100)} ·
                              Máximo consumible: {formatCentiKg(diagnostic.maximumConsumableKg100)} ·
                              Exceso: {formatCentiKg(diagnostic.excessKg100)}
                            </p>
                            <p className="mt-1">
                              El saldo asignado supera los kg físicamente reportados para este producto. Redistribuye el consumo entre Día/Noche o deja el remanente pendiente.
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </fieldset>
      </SectionCard>

      {!usesExternalAvailability ? (
      <SectionCard
        title="Saldo generado al cierre"
        description="Registra únicamente producto real de esta jornada que quedará pendiente para después."
        action={<StatusBadge tone="info">JORNADA ORIGEN ACTUAL</StatusBadge>}
        style={{ overflow: 'visible' }}
      >
        <fieldset disabled={!reportsReconciled} className="disabled:opacity-65">
          <legend className="sr-only">Saldo generado al cierre</legend>
          <div className="grid gap-3 border-b border-slate-200 p-4 sm:p-5 lg:grid-cols-[minmax(13rem,0.7fr)_minmax(24rem,1.3fr)_auto] lg:items-end">
            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Buscar producto para saldo
              </span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={closingSearch}
                  placeholder="Ej.: aleta, manto o nuca"
                  autoComplete="off"
                  onChange={(event) => {
                    setClosingSearch(event.target.value)
                    setSelectedClosingProductId('')
                  }}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </span>
            </label>
            <label className="min-w-0">
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                Producto exacto del catálogo
              </span>
              <select
                value={selectedClosingProductId}
                onChange={(event) => setSelectedClosingProductId(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-brand-400"
              >
                <option value="">Seleccionar producto…</option>
                {closingCatalogItems.map((product) => (
                  <option key={product.productId} value={product.productId}>
                    {product.familyName} · {product.productName}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!selectedClosingProductId}
              onClick={addClosingProduct}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-4 text-sm font-bold text-brand-900 hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden="true" />
              Agregar saldo
            </button>
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-4 lg:p-4">
            {closingRows.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500 lg:px-1">
                Busca y agrega únicamente los productos que generaron saldo real.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {closingRows.map((row) => (
                  <div
                    key={`closing-${row.key}`}
                    className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_10rem] sm:items-center sm:px-5 lg:px-1"
                  >
                    <div className="min-w-0">
                      <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-brand-700">
                        {row.product.familyName}
                      </p>
                      <p className="mt-0.5 truncate text-xs font-semibold text-slate-800" title={row.product.productName}>
                        {row.product.productName}
                      </p>
                    </div>
                    <div className="flex items-end gap-2">
                      <QuantityInput
                        label="Saldo al cierre"
                        value={row.closingBalanceKg}
                        disabled={!reportsReconciled}
                        onChange={(value) =>
                          updateRow(row.key, 'closingBalanceKg', value)
                        }
                        className="min-w-0 flex-1"
                      />

                      <button
                        type="button"
                        onClick={() => removeClosingProduct(row.key)}
                        className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                        aria-label={`Eliminar saldo de ${row.product.productName}`}
                        title="Eliminar saldo"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                    <ClosingBalanceRowControl
                      summary={businessSummary}
                      summaryGroupId={row.product.summaryGroupId}
                    />
                  </div>
                ))}
              </div>
            )}
            <ClosingBalanceYieldControl summary={businessSummary} />
          </div>
        </fieldset>
      </SectionCard>
      ) : null}

      <SectionCard
        title="Producto terminado calculado"
        description={
          isFreezing
            ? 'Distingue la ejecución física de Congelamiento de la producción atribuida a su jornada de Envasado.'
            : isBalanceOnly
            ? 'Distingue el procesamiento físico del domingo de la producción propia atribuible a nueva materia prima.'
            : 'Desglose operativo derivado del estado actual; ningún valor es editable.'
        }
      >
        {usesExternalAvailability ? (
          <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
            <MetricCard label={isFreezing ? 'Congelado físicamente' : 'Procesado físicamente'} value={formatCentiKg(totalReportedKg100)} tone="brand" />
            <MetricCard label="Producción productiva atribuida" value={formatCentiKg(buildResult.calculation.ownTurnProductionKg100)} />
            <MetricCard label={isFreezing ? 'Disponible no utilizado' : 'Saldo anterior pendiente'} value={formatCentiKg(buildResult.calculation.pendingPreviousBalanceKg100)} />
          </div>
        ) : (
        <div className={`grid gap-3 p-4 sm:grid-cols-2 sm:p-5 ${draft.hasTunnelProduction ? 'xl:grid-cols-6' : 'xl:grid-cols-5'}`}>
          <MetricCard label="Reporte propio Día" value={formatCentiKg(buildResult.calculation.day.ownProductionKg100)} />
          <MetricCard label="Reporte propio Noche" value={formatCentiKg(buildResult.calculation.night.ownProductionKg100)} />
          {draft.hasTunnelProduction ? (
            <MetricCard label="Túnel total" value={formatCentiKg(buildResult.calculation.tunnel.totalKg100)} />
          ) : null}
          <MetricCard label="Tratamiento" value={formatCentiKg(buildResult.calculation.treatmentKg100)} />
          <MetricCard label="Saldo al cierre" value={formatCentiKg(buildResult.calculation.newClosingBalanceKg100)} />
          <MetricCard label="Producto terminado" value={formatCentiKg(businessSummary.finishedKg100)} tone="brand" />
        </div>
        )}
      </SectionCard>

      <section className="grid gap-3 sm:grid-cols-2" aria-label="Validación en tiempo real">
        <MetricCard
          label="Diferencia final"
          value={formatCentiKg(buildResult.calculation.differenceKg100)}
          tone={buildResult.calculation.differenceKg100 === 0 ? 'success' : 'danger'}
        />
        <MetricCard
          label={isFreezing ? 'Referencia operativa' : 'Aprovechamiento general'}
          value={
            usesExternalAvailability
              ? 'NO APLICA'
              : businessSummary.overallUtilization.percent === null
              ? 'No disponible'
              : `${businessSummary.overallUtilization.percent.toLocaleString('es-PE', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}%`
          }
          tone={
            usesExternalAvailability
              ? 'neutral'
              : businessSummary.overallUtilization.percent !== null &&
            businessSummary.overallUtilization.percent >= 80 &&
            businessSummary.overallUtilization.percent <= 100
              ? 'success'
              : 'danger'
          }
          description={
            usesExternalAvailability
              ? isFreezing
                ? 'No aplica el 80%; Congelamiento se valida contra disponibilidad de Envasado.'
                : 'Jornada de saldos sin nueva materia prima.'
              : 'Debe estar entre 80% y 100% para cerrar.'
          }
        />
      </section>

      {!usesExternalAvailability ? (
        <TubeMpBalancePanel balance={businessSummary.tubeMpBalance} />
      ) : null}

      {!usesExternalAvailability ? (
        <FamilyYieldPanel
          summary={businessSummary}
          showTunnel={draft.hasTunnelProduction}
        />
      ) : null}

      {!canClose && (closureValidation.blockers.length > 0 || diagnostics.length > 0) ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-[0.06em] text-amber-900">Pendientes para cerrar</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-900">
            {[
              ...closureValidation.blockers
                .filter((blocker) => blocker.code !== 'TUNNEL_MOVEMENTS_REQUIRED')
                .map((blocker) => blocker.message),
              ...diagnostics
                .filter((diagnostic) => diagnostic.code !== 'SHIFT_BALANCED')
                .map((diagnostic) => diagnostic.message),
            ]
              .filter((message, index, messages) => messages.indexOf(message) === index)
              .slice(0, 12)
              .map((message) => <li key={message}>• {message}</li>)}
          </ul>
        </div>
      ) : null}

      {saveError ? (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {saveError}
        </div>
      ) : null}

      {pendingProcessChange ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="process-change-title"
            className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#0d1f2c] shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700">
                <AlertTriangle className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="process-change-title" className="text-base font-bold text-slate-950">
                  Cambiar a {pendingProcessChange === 'FREEZING' ? 'Congelamiento' : 'Envasado'}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Existen datos sin guardar en la jornada de {draft.process === 'FREEZING' ? 'Congelamiento' : 'Envasado'}. Se conservarán separados mientras cambias de proceso.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingProcessChange(null)}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const process = pendingProcessChange
                  setPendingProcessChange(null)
                  applyProcessChange(process)
                }}
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-700 px-4 text-sm font-bold text-white hover:bg-brand-800"
              >
                Cambiar proceso
              </button>
            </div>
          </section>
        </div>
      ) : null}

            {isCloseConfirmationOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="yield-warning-title"
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#203E50] bg-[#0D2534] shadow-2xl"
          >
            {/* Encabezado */}
            <div className="border-b border-[#203E50] px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-400">
                  <AlertTriangle className="size-4" aria-hidden="true" />
                </span>
            
                <div className="min-w-0">
                  <h2
                    id="yield-warning-title"
                    className="text-base font-bold text-[#F3F8FB]"
                  >
                    Cerrar jornada
                  </h2>
            
                  <p className="mt-1 text-xs leading-5 text-[#A5BED0]">
                    Después del cierre, esta jornada quedará en solo lectura.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-5 py-4 sm:px-6">
              {/* Resumen de la jornada */}
              <dl className="grid gap-x-6 gap-y-3 rounded-xl border border-[#203E50] bg-[#07141F]/70 p-4 sm:grid-cols-3">
                {[
                  ['Fecha', formatIsoDate(draft.date)],
                  [
                    'Materia prima',
                    isFreezing
                      ? 'No aplica'
                      : formatCentiKg(
                          buildResult.productionDay.declaredRawMaterialKg100,
                        ),
                  ],
                  [
                    'Producto terminado',
                    formatCentiKg(
                      buildResult.calculation.declaredFinishedKg100,
                    ),
                  ],
                  [
                    'Saldo final',
                    formatCentiKg(
                      buildResult.calculation.newClosingBalanceKg100,
                    ),
                  ],
                  [
                    'Diferencia',
                    formatCentiKg(
                      buildResult.calculation.differenceKg100,
                    ),
                  ],
                  [
                    'Aprovechamiento',
                    usesExternalAvailability
                      ? 'No aplica'
                      : `${
                          businessSummary.generalYieldPercent?.toFixed(2) ?? '—'
                        }%`,
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-[#7F9BAD]">
                      {label}
                    </dt>
                
                    <dd className="number-tabular mt-1 truncate text-sm font-bold text-[#F3F8FB]">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              
              {/* Advertencias */}
              {closureValidation.warnings.length > 0 ? (
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#A5BED0]">
                      Advertencias antes del cierre
                    </p>
              
                    <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[0.625rem] font-bold text-amber-300">
                      {closureValidation.warnings.length}{' '}
                      {closureValidation.warnings.length === 1
                        ? 'advertencia'
                        : 'advertencias'}
                    </span>
                  </div>
                      
                  <div className="overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/[0.05]">
                    {closureValidation.warnings.map((warning, index) => (
                      <div
                        key={`${warning.code}-${warning.familyKey ?? 'GENERAL'}`}
                        className={`flex items-start gap-3 px-4 py-3 ${
                          index > 0
                            ? 'border-t border-amber-500/10'
                            : ''
                        }`}
                      >
                        <AlertTriangle
                          className="mt-0.5 size-4 shrink-0 text-amber-400"
                          aria-hidden="true"
                        />

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-amber-200">
                            {warning.code === 'ANILLAS_MP_EXCEEDS_AVAILABLE'
                              ? 'Variación técnica de MP · Anillas'
                              : warning.familyKey
                                ? 'Rendimiento de familia'
                                : 'Advertencia'}
                          </p>
                            
                          <p className="mt-1 text-xs leading-5 text-[#C3D2DC]">
                            {warning.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            
            {/* Acciones */}
            <div className="flex flex-col-reverse gap-2 border-t border-[#203E50] bg-[#0A1A27] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={() => setIsCloseConfirmationOpen(false)}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#2B5268] bg-transparent px-4 text-sm font-bold text-[#C3D2DC] transition hover:bg-[#123247] hover:text-white"
              >
                Volver a revisar
              </button>
            
              <button
                type="button"
                onClick={() => persist(true, true)}
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-500"
              >
                {closureValidation.warnings.length > 0
                  ? 'Cerrar con observación'
                  : 'Cerrar jornada'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 py-3 shadow-[0_-8px_30px_rgb(15_23_42/0.08)] backdrop-blur dark:border-[#2b5268] dark:bg-[#0a1a27] xl:left-64 xl:h-[var(--sidebar-footer-height)] xl:py-0">
        <div className="mx-auto flex w-full max-w-[92.5rem] flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-6 xl:h-full xl:px-7 2xl:px-8">
          <div className="flex items-center gap-2" role="status" aria-live="polite">
            {canClose ? <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" /> : <AlertTriangle className="size-5 text-amber-600" aria-hidden="true" />}
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-[#f3f8fb]">{footerStatus.title}</p>
              <p className="text-[0.6875rem] text-slate-500 dark:text-[#a5bed0]">{footerStatus.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => persist(false)} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 sm:flex-none">
              <Save className="size-4" aria-hidden="true" />
              Guardar borrador
            </button>
            <button type="button" disabled={!canClose} onClick={() => persist(true)} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 sm:flex-none">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Cerrar jornada
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductionEntryPage
