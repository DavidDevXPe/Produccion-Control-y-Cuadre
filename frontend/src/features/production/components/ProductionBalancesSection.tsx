import { useMemo, useState } from 'react'
import { AlertTriangle, ChevronDown, Trash2 } from 'lucide-react'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg, formatIsoDate } from '../../../utils/formatters'
import type { FreezingOriginLedgerRow } from '../capture/freezingOriginLedger'
import type { ProductionCatalogItem } from '../capture/productionCatalog'
import type { ProductionCaptureDraft } from '../capture/productionCapture'
import { captureBalancePosition } from '../capture/productionEntryHelpers'
import { useGridKeyboardNavigation } from '../hooks/useGridKeyboardNavigation'
import type { BalanceShiftDiagnostic } from '../model/businessRules'
import type {
  Kg100,
  OutstandingBalancePosition,
  ProductionProcess,
} from '../model/types'
import { ProductPicker } from './ProductPicker'
import { QuantityInput } from './QuantityInput'

export interface FreezingBalanceExplanation {
  readonly selectedAvailableKg100: Kg100
  readonly pendingInSelectedKg100: Kg100
  readonly untouchedKg100: Kg100
  readonly untracedFrozenKg100: Kg100
  readonly physicalDifferenceKg100: Kg100
  readonly untouchedPositions: readonly {
    readonly originDayId: string
    readonly productId: string
    readonly productName: string
    readonly originDate: string
    readonly pendingKg100: Kg100
  }[]
}

export interface FreezingTraceabilitySummary {
  readonly totalProducts: number
  readonly traceableProducts: number
  readonly pendingProducts: number
  readonly problemProducts: number
  readonly tracedKg100: Kg100
  readonly reportedKg100: Kg100
  readonly pendingKg100: Kg100
  readonly excessLinkedKg100: Kg100
}

export interface FreezingBalanceUseSummary {
  readonly originCount: number
  readonly availableKg100: Kg100
  readonly usedKg100: Kg100
  readonly remainingKg100: Kg100
  readonly reviewCount: number
}

export interface ProductionBalancesSectionProps {
  readonly isFreezing: boolean
  readonly isBalanceOnly: boolean
  readonly usesExternalAvailability: boolean
  readonly reportsReconciled: boolean
  readonly totalReportedKg100: Kg100
  readonly draft: ProductionCaptureDraft
  readonly availableBalances: readonly OutstandingBalancePosition[]
  readonly freezingPreviousOriginsAvailableKg100: Kg100
  readonly freezingCurrentOriginAvailableKg100: Kg100
  readonly freezingTotalAvailableKg100: Kg100
  readonly freezingLinkedThisDayKg100: Kg100
  readonly freezingPendingAfterKg100: Kg100
  readonly freezingBalanceExplanation: FreezingBalanceExplanation
  readonly freezingPendingLinkCount: number
  readonly freezingTraceabilitySummary: FreezingTraceabilitySummary
  readonly freezingOriginLedger: readonly FreezingOriginLedgerRow[]
  readonly freezingAutomaticOriginStartDate: string
  readonly selectedProcess: ProductionProcess
  readonly freezingBalanceUseSummary: FreezingBalanceUseSummary | null
  readonly balanceShiftDiagnostics: readonly BalanceShiftDiagnostic[]
  readonly catalogItems: readonly ProductionCatalogItem[]
  readonly onOpenBulkFreezingLink: () => void
  readonly onAddBalance: (balance: OutstandingBalancePosition) => void
  readonly onRemoveBalanceUse: (key: string) => void
  readonly onDistributeLegacyBalance: (key: string, productId: string) => void
  readonly onUpdateBalanceUse: (
    key: string,
    field: 'dayKg' | 'nightKg',
    value: string,
  ) => void
}

export function ProductionBalancesSection({
  isFreezing,
  isBalanceOnly,
  usesExternalAvailability,
  reportsReconciled,
  totalReportedKg100,
  draft,
  availableBalances,
  freezingPreviousOriginsAvailableKg100,
  freezingCurrentOriginAvailableKg100,
  freezingTotalAvailableKg100,
  freezingLinkedThisDayKg100,
  freezingPendingAfterKg100,
  freezingBalanceExplanation,
  freezingPendingLinkCount,
  freezingTraceabilitySummary,
  freezingOriginLedger,
  freezingAutomaticOriginStartDate,
  selectedProcess,
  freezingBalanceUseSummary,
  balanceShiftDiagnostics,
  catalogItems,
  onOpenBulkFreezingLink,
  onAddBalance,
  onRemoveBalanceUse,
  onDistributeLegacyBalance,
  onUpdateBalanceUse,
}: ProductionBalancesSectionProps) {
  const [isFreezingOriginsOpen, setIsFreezingOriginsOpen] = useState(false)

  const { getGridCellProps: getBalancesCellProps } = useGridKeyboardNavigation({
    totalRows: draft.balanceUses.length,
    columns: 2,
    gridId: 'balances-grid',
  })

  const shouldShowBalanceUseDetails =
    !isFreezing ||
    isFreezingOriginsOpen ||
    (freezingBalanceUseSummary?.reviewCount ?? 0) > 0

  const freezingTraceabilityCoveragePercent =
    freezingTraceabilitySummary.reportedKg100 > 0
      ? Math.min(
          100,
          (freezingTraceabilitySummary.tracedKg100 /
            freezingTraceabilitySummary.reportedKg100) *
            100,
        )
      : null

  const freezingTraceabilityOverview =
    freezingTraceabilitySummary.totalProducts === 0
      ? {
          tone: 'neutral' as const,
          label: 'SIN MOVIMIENTOS',
        }
      : freezingTraceabilitySummary.problemProducts > 0 ||
          freezingTraceabilitySummary.excessLinkedKg100 > 0
        ? {
            tone: 'danger' as const,
            label: 'REVISAR TRAZABILIDAD',
          }
        : freezingTraceabilitySummary.pendingProducts > 0
          ? {
              tone: 'warning' as const,
              label: 'VINCULACIÓN PENDIENTE',
            }
          : {
              tone: 'success' as const,
              label: 'TRAZABILIDAD COMPLETA',
            }

  const freezingTraceabilityProgressClass =
    freezingTraceabilityOverview.tone === 'danger'
      ? 'bg-rose-500'
      : freezingTraceabilityOverview.tone === 'warning'
        ? 'bg-amber-500'
        : freezingTraceabilityOverview.tone === 'success'
          ? 'bg-emerald-500'
          : 'bg-slate-400'

  const freezingOriginLedgerSummary = useMemo(() => {
    const pendingOrigins = freezingOriginLedger.filter(
      (row) => row.pendingKg100 > 0,
    ).length
    const completeOrigins = freezingOriginLedger.filter(
      (row) => row.status === 'COMPLETE',
    ).length
    const excessOrigins = freezingOriginLedger.filter(
      (row) => row.excessKg100 > 0,
    ).length

    return {
      totalOrigins: freezingOriginLedger.length,
      pendingOrigins,
      completeOrigins,
      excessOrigins,
    }
  }, [freezingOriginLedger])

  return (
    <SectionCard
      allowStickyContent
      title={
        isFreezing
          ? 'Origen y consumo de saldos de Envasado'
          : 'Saldos anteriores procesados'
      }
      description={
        isFreezing
          ? 'Revisa de qué jornada de Envasado proviene cada saldo, cuánto se consume por turno y cuánto queda pendiente. FIFO prioriza los orígenes más antiguos.'
          : isBalanceOnly
            ? 'Fuente principal del domingo: vincula cada kg procesado con su jornada de origen y turno.'
            : 'Selecciona lotes pendientes reales y distribuye su consumo entre Día y Noche.'
      }
      action={<StatusBadge tone="info">ORIGEN TRAZABLE</StatusBadge>}
    >
      {isFreezing ? (
        <dl className="grid gap-px border-b border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-6">
          {[
            ['Saldo jornadas anteriores', freezingPreviousOriginsAvailableKg100],
            ['Jornada actual de Envasado', freezingCurrentOriginAvailableKg100],
            ['Total disponible trazable', freezingTotalAvailableKg100],
            ['Congelado reportado', totalReportedKg100],
            ['Vinculado a origen', freezingLinkedThisDayKg100],
            ['Pendiente por congelar', freezingPendingAfterKg100],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-white px-4 py-3 text-center">
              <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500">
                {String(label)}
              </dt>
              <dd className="number-tabular mt-1 whitespace-nowrap text-sm font-extrabold text-slate-950">
                {formatCentiKg(value as Kg100)}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {isFreezing ? (
        <div
          role="region"
          aria-label="Explicación del saldo de Congelamiento"
          className="border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-ui-line-dark-grid"
        >
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-recessed/60">
            <div className="border-b border-slate-200 px-4 py-4 dark:border-ui-line-dark-grid">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.07em] text-slate-800 dark:text-ui-text-dark-strong">
                    ¿De dónde sale el saldo?
                  </p>
                  <p className="mt-1 max-w-4xl text-xs leading-5 text-slate-500 dark:text-ui-text-dark-soft">
                    El saldo pendiente no representa necesariamente un error. Parte
                    corresponde a producto que comenzó a congelarse y todavía queda
                    disponible, y otra parte a producto envasado que aún no tuvo
                    movimiento de Congelamiento.
                  </p>
                </div>
                <StatusBadge
                  tone={
                    freezingBalanceExplanation.untracedFrozenKg100 > 0
                      ? 'warning'
                      : 'success'
                  }
                >
                  {freezingBalanceExplanation.untracedFrozenKg100 > 0
                    ? 'CON OBSERVACIÓN'
                    : 'EXPLICADO'}
                </StatusBadge>
              </div>
            </div>

            <div className="grid gap-px bg-slate-200 sm:grid-cols-3 dark:bg-ui-line-dark-grid">
              <div className="bg-white px-4 py-3 dark:bg-ui-surface-dark">
                <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
                  Envasado disponible
                </p>
                <p className="number-tabular mt-1 text-base font-extrabold text-slate-950 dark:text-ui-text-dark-strong">
                  {formatCentiKg(freezingTotalAvailableKg100)}
                </p>
              </div>

              <div className="bg-white px-4 py-3 dark:bg-ui-surface-dark">
                <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
                  Congelado físicamente
                </p>
                <p className="number-tabular mt-1 text-base font-extrabold text-slate-950 dark:text-ui-text-dark-strong">
                  {formatCentiKg(totalReportedKg100)}
                </p>
              </div>

              <div className="bg-white px-4 py-3 dark:bg-ui-surface-dark">
                <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
                  Diferencia física
                </p>
                <p className="number-tabular mt-1 text-base font-extrabold text-amber-700 dark:text-amber-300">
                  {formatCentiKg(
                    freezingBalanceExplanation.physicalDifferenceKg100,
                  )}
                </p>
              </div>
            </div>

            <div className="grid gap-4 p-4 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark">
                <p className="text-xs font-bold text-slate-900 dark:text-ui-text-dark-strong">
                  Cómo se compone el saldo trazable
                </p>
                <dl className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-500 dark:text-ui-text-dark-soft">
                      Pendiente en productos que sí tuvieron movimiento
                    </dt>
                    <dd className="number-tabular font-bold text-amber-700 dark:text-amber-300">
                      {formatCentiKg(
                        freezingBalanceExplanation.pendingInSelectedKg100,
                      )}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-500 dark:text-ui-text-dark-soft">
                      Producto todavía no utilizado
                    </dt>
                    <dd className="number-tabular font-bold text-amber-700 dark:text-amber-300">
                      {formatCentiKg(
                        freezingBalanceExplanation.untouchedKg100,
                      )}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-2 dark:border-ui-line-dark-grid">
                    <dt className="font-bold text-slate-800 dark:text-ui-text-dark-strong">
                      Saldo trazable para jornadas siguientes
                    </dt>
                    <dd className="number-tabular font-extrabold text-slate-950 dark:text-ui-text-dark-strong">
                      {formatCentiKg(freezingPendingAfterKg100)}
                    </dd>
                  </div>
                </dl>

                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[0.6875rem] leading-5 text-slate-600 dark:bg-ui-surface-dark-recessed dark:text-ui-text-dark-soft">
                  {formatCentiKg(
                    freezingBalanceExplanation.pendingInSelectedKg100,
                  )}{' '}
                  + {formatCentiKg(freezingBalanceExplanation.untouchedKg100)} ={' '}
                  <strong>{formatCentiKg(freezingPendingAfterKg100)}</strong>
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark">
                <p className="text-xs font-bold text-slate-900 dark:text-ui-text-dark-strong">
                  Diferencia frente al congelado físico
                </p>
                <dl className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-500 dark:text-ui-text-dark-soft">
                      Congelado con origen identificado
                    </dt>
                    <dd className="number-tabular font-bold text-emerald-700 dark:text-emerald-300">
                      {formatCentiKg(freezingLinkedThisDayKg100)}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-slate-500 dark:text-ui-text-dark-soft">
                      Congelado sin origen suficiente
                    </dt>
                    <dd
                      className={`number-tabular font-bold ${
                        freezingBalanceExplanation.untracedFrozenKg100 > 0
                          ? 'text-rose-700 dark:text-rose-300'
                          : 'text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      {formatCentiKg(
                        freezingBalanceExplanation.untracedFrozenKg100,
                      )}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-2 dark:border-ui-line-dark-grid">
                    <dt className="font-bold text-slate-800 dark:text-ui-text-dark-strong">
                      Diferencia física Envasado vs Congelado
                    </dt>
                    <dd className="number-tabular font-extrabold text-amber-700 dark:text-amber-300">
                      {formatCentiKg(
                        freezingBalanceExplanation.physicalDifferenceKg100,
                      )}
                    </dd>
                  </div>
                </dl>

                {freezingBalanceExplanation.untracedFrozenKg100 > 0 ? (
                  <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[0.6875rem] font-semibold leading-5 text-amber-900 dark:border-ui-amber-border-dark-soft dark:bg-ui-amber-surface-dark dark:text-ui-amber-text-dark-bright">
                    Hay producto congelado cuya presentación u origen no alcanza a
                    justificarse completamente. La jornada puede cerrarse con
                    observación y la diferencia quedará registrada para revisión.
                  </div>
                ) : null}
              </div>
            </div>

            {freezingBalanceExplanation.untouchedPositions.length > 0 ? (
              <div className="border-t border-slate-200 px-4 py-3 dark:border-ui-line-dark-grid">
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-600 dark:text-ui-text-dark-soft">
                  Producto disponible que todavía no fue utilizado
                </p>
                <div className="mt-2 grid gap-2 lg:grid-cols-2">
                  {freezingBalanceExplanation.untouchedPositions.map(
                    (position) => (
                      <div
                        key={`${position.originDayId}-${position.productId}`}
                        className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[0.6875rem] font-bold text-slate-800 dark:text-ui-text-dark-strong">
                            {position.productName}
                          </p>
                          <p className="mt-0.5 text-[0.625rem] text-slate-400 dark:text-ui-text-soft">
                            Origen {formatIsoDate(position.originDate)}
                          </p>
                        </div>
                        <span className="number-tabular shrink-0 text-xs font-extrabold text-amber-700 dark:text-amber-300">
                          {formatCentiKg(position.pendingKg100)}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {isFreezing && freezingPendingLinkCount > 0 ? (
        <div className="border-b border-slate-200 px-4 py-3 sm:px-5 dark:border-ui-line-dark-grid">
          <div className="flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-ui-amber-border-dark-soft dark:bg-ui-amber-surface-dark-deep">
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-amber-900 dark:text-ui-amber-text-dark">
                Vinculación FIFO disponible
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-ui-amber-text-dark-pale">
                {freezingPendingLinkCount}{' '}
                {freezingPendingLinkCount === 1
                  ? 'producto tiene'
                  : 'productos tienen'}{' '}
                kilos pendientes de vincular. El sistema consumirá primero las
                jornadas de Envasado abiertas más antiguas para cada producto.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenBulkFreezingLink}
              className="inline-flex min-h-9 shrink-0 items-center justify-center rounded-lg border border-amber-400 bg-white px-3 text-xs font-extrabold text-amber-900 shadow-sm transition-all hover:border-amber-500 hover:bg-amber-100 hover:shadow-md active:scale-[0.98] dark:border-ui-amber-border-dark dark:bg-ui-surface-dark dark:text-ui-amber-text-dark-bright dark:hover:border-ui-amber-text-dark dark:hover:bg-ui-amber-surface-dark dark:hover:text-ui-amber-text-dark-pale"
            >
              Vincular todos FIFO
            </button>
          </div>
        </div>
      ) : null}

      {isFreezing && freezingTraceabilitySummary.totalProducts > 0 ? (
        <div
          role="region"
          aria-label="Resumen de trazabilidad de Congelamiento"
          className="border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-ui-line-dark-grid"
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-recessed/60">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.06em] text-slate-700 dark:text-ui-text-dark-soft">
                  Resumen de trazabilidad
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-ui-text-soft">
                  Estado de los productos reportados en Congelamiento frente a su
                  origen trazable de Envasado.
                </p>
              </div>
              <StatusBadge tone={freezingTraceabilityOverview.tone}>
                {freezingTraceabilityOverview.label}
              </StatusBadge>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark">
                <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
                  Productos reportados
                </dt>
                <dd className="mt-1 text-lg font-extrabold text-slate-900 dark:text-ui-text-dark-strong">
                  {freezingTraceabilitySummary.totalProducts}
                </dd>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/[0.05]">
                <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-emerald-700 dark:text-emerald-300">
                  Trazables
                </dt>
                <dd className="mt-1 text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                  {freezingTraceabilitySummary.traceableProducts}
                </dd>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-3 dark:border-amber-500/20 dark:bg-amber-500/[0.05]">
                <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-amber-700 dark:text-amber-300">
                  Pendientes
                </dt>
                <dd className="mt-1 text-lg font-extrabold text-amber-700 dark:text-amber-300">
                  {freezingTraceabilitySummary.pendingProducts}
                </dd>
              </div>

              <div className="rounded-lg border border-rose-200 bg-rose-50/50 px-3 py-3 dark:border-rose-500/20 dark:bg-rose-500/[0.05]">
                <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-rose-700 dark:text-rose-300">
                  Con problema
                </dt>
                <dd className="mt-1 text-lg font-extrabold text-rose-700 dark:text-rose-300">
                  {freezingTraceabilitySummary.problemProducts}
                </dd>
              </div>
            </dl>

            <div className="mt-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-ui-text-dark-pale">
                    Cobertura vinculada
                  </p>
                  <p className="mt-0.5 text-[0.6875rem] text-slate-500 dark:text-ui-text-soft">
                    Kg reportados que ya cuentan con origen de Envasado
                    identificado.
                  </p>
                </div>
                <span className="number-tabular shrink-0 text-lg font-extrabold text-slate-900 dark:text-ui-text-dark-strong">
                  {freezingTraceabilityCoveragePercent === null
                    ? '—'
                    : `${freezingTraceabilityCoveragePercent.toFixed(2)}%`}
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-ui-line-dark-grid">
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ${freezingTraceabilityProgressClass}`}
                  style={{
                    width: `${freezingTraceabilityCoveragePercent ?? 0}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex flex-col gap-1 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between dark:text-ui-text-dark-soft">
                <p>
                  <strong className="number-tabular text-slate-900 dark:text-ui-text-dark-strong">
                    {formatCentiKg(freezingTraceabilitySummary.tracedKg100)}
                  </strong>{' '}
                  de{' '}
                  <strong className="number-tabular text-slate-900 dark:text-ui-text-dark-strong">
                    {formatCentiKg(freezingTraceabilitySummary.reportedKg100)}
                  </strong>{' '}
                  con origen vinculado.
                </p>
                {freezingTraceabilitySummary.pendingKg100 > 0 ? (
                  <p className="number-tabular font-bold text-amber-700 dark:text-amber-300">
                    Faltan{' '}
                    {formatCentiKg(freezingTraceabilitySummary.pendingKg100)}
                  </p>
                ) : (
                  <p className="font-bold text-emerald-700 dark:text-emerald-300">
                    Sin kilos pendientes.
                  </p>
                )}
              </div>

              {freezingTraceabilitySummary.excessLinkedKg100 > 0 ? (
                <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200">
                  Existen{' '}
                  {formatCentiKg(freezingTraceabilitySummary.excessLinkedKg100)}{' '}
                  vinculados por encima de los kilos reportados. Revisa la
                  distribución Día/Noche.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isFreezing && freezingOriginLedger.length > 0 ? (
        <div
          role="region"
          aria-label="Cuenta corriente por jornada origen de Envasado"
          className="border-b border-slate-200 px-4 py-4 sm:px-5 dark:border-ui-line-dark-grid"
        >
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-ui-line-dark-grid">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-start sm:justify-between dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-recessed/60">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.06em] text-slate-800 dark:text-ui-text-dark-strong">
                  Cuenta corriente por jornada origen
                </p>
                <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500 dark:text-ui-text-dark-soft">
                  Cada jornada de Envasado conserva sus kilos pendientes hasta que
                  todo el producto generado quede congelado al 100%.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge tone="neutral">
                  {freezingOriginLedgerSummary.totalOrigins} JORNADAS
                </StatusBadge>
                {freezingOriginLedgerSummary.pendingOrigins > 0 ? (
                  <StatusBadge tone="warning">
                    {freezingOriginLedgerSummary.pendingOrigins} CON SALDO
                  </StatusBadge>
                ) : null}
                {freezingOriginLedgerSummary.excessOrigins > 0 ? (
                  <StatusBadge tone="danger">
                    {freezingOriginLedgerSummary.excessOrigins} CON EXCESO
                  </StatusBadge>
                ) : null}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table
                className="w-full min-w-[70rem] border-collapse text-left"
                aria-label="Saldo de Congelamiento por jornada origen"
              >
                <thead>
                  <tr className="border-b-2 border-slate-300 bg-slate-100 text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-800 dark:border-ui-line-dark dark:bg-ui-surface-dark-compact dark:text-ui-text-dark-strong">
                    <th className="px-4 py-3">Jornada origen</th>
                    <th className="px-3 py-3 text-center">Productos</th>
                    <th className="px-3 py-3 text-right">Generado para congelar</th>
                    <th className="px-3 py-3 text-right">Congelado acumulado</th>
                    <th className="px-3 py-3 text-right">
                      Congelado en esta jornada
                    </th>
                    <th className="px-3 py-3 text-right">Pendiente</th>
                    <th className="px-3 py-3 text-right">Avance</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {freezingOriginLedger.map((row) => (
                    <tr
                      key={row.originDayId}
                      className="border-b border-slate-100 bg-white last:border-b-0 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark"
                    >
                      <th className="px-4 py-3">
                        <p className="text-xs font-bold text-slate-900 dark:text-ui-text-dark-strong">
                          {formatIsoDate(row.originDate)}
                        </p>
                        <p className="mt-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.05em] text-slate-400 dark:text-ui-text-soft">
                          Envasado
                        </p>
                      </th>
                      <td className="number-tabular px-3 py-3 text-center text-xs font-bold text-slate-700 dark:text-ui-text-dark-pale">
                        {row.productCount}
                      </td>
                      <td className="number-tabular px-3 py-3 text-right text-xs font-bold text-slate-900 dark:text-ui-text-dark-strong">
                        {formatCentiKg(row.generatedKg100)}
                      </td>
                      <td className="number-tabular px-3 py-3 text-right text-xs font-bold text-slate-900 dark:text-ui-text-dark-strong">
                        {formatCentiKg(row.frozenAccumulatedKg100)}
                      </td>
                      <td className="number-tabular px-3 py-3 text-right text-xs text-brand-700 dark:text-sky-300">
                        {formatCentiKg(row.frozenCurrentKg100)}
                      </td>
                      <td
                        className={`number-tabular px-3 py-3 text-right text-xs font-bold ${
                          row.excessKg100 > 0
                            ? 'text-rose-700 dark:text-rose-300'
                            : row.pendingKg100 > 0
                              ? 'text-amber-700 dark:text-amber-300'
                              : 'text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {row.excessKg100 > 0
                          ? `Exceso ${formatCentiKg(row.excessKg100)}`
                          : formatCentiKg(row.pendingKg100)}
                      </td>
                      <td className="number-tabular px-3 py-3 text-right text-xs font-extrabold text-slate-900 dark:text-ui-text-dark-strong">
                        {row.completionPercent.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge
                          tone={
                            row.status === 'EXCESS'
                              ? 'danger'
                              : row.status === 'COMPLETE'
                                ? 'success'
                                : 'warning'
                          }
                        >
                          {row.status === 'EXCESS'
                            ? 'REVISAR EXCESO'
                            : row.status === 'COMPLETE'
                              ? 'CONGELADO 100%'
                              : 'PENDIENTE'}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      <fieldset
        disabled={!usesExternalAvailability && !reportsReconciled}
        className="min-w-0 disabled:opacity-65"
      >
        <legend className="sr-only">Consumo de saldos anteriores</legend>
        <ProductPicker
          items={availableBalances}
          getItemId={(balance) => `${balance.originDayId}|${balance.productId}`}
          getItemLabel={(balance) =>
            `${formatIsoDate(balance.originDate)} · ${balance.familyName} · ${balance.productName}`
          }
          getItemMeta={(balance) => ({
            group: isFreezing
              ? balance.originDate === draft.date
                ? 'JORNADA ACTUAL DE ENVASADO'
                : balance.originDate >= freezingAutomaticOriginStartDate &&
                    balance.originDate < draft.date
                  ? 'JORNADAS ANTERIORES CON SALDO'
                  : 'HISTÓRICO · VINCULACIÓN MANUAL'
              : balance.familyName,
            secondaryText: formatCentiKg(balance.pendingKg100),
          })}
          onAdd={(balance) => onAddBalance(balance)}
          label={
            isFreezing
              ? 'Vincular origen de Envasado'
              : 'Saldo pendiente disponible'
          }
          placeholder={
            isFreezing
              ? 'Buscar jornada origen o producto…'
              : 'Buscar saldo pendiente…'
          }
          buttonLabel={isFreezing ? 'Vincular origen' : 'Usar saldo'}
          disabled={!usesExternalAvailability && !reportsReconciled}
          scopeKey={`${selectedProcess}:BALANCES`}
          noResultsText={
            availableBalances.length === 0
              ? isFreezing
                ? 'No hay producto envasado pendiente de congelar'
                : 'No hay otros saldos pendientes disponibles'
              : 'Sin saldos coincidentes'
          }
        />

        {draft.balanceUses.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-ui-text-dark-soft">
            {isFreezing
              ? 'No se ha vinculado producto disponible desde Envasado.'
              : 'No se han asignado saldos de jornadas anteriores.'}
          </p>
        ) : (
          <>
            {isFreezing && freezingBalanceUseSummary ? (
              <div className="border-b border-slate-200 bg-slate-50/55 dark:border-ui-line-dark-grid dark:bg-ui-surface-dark-recessed/45">
                <dl className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4 dark:bg-ui-line-dark-grid">
                  <div className="bg-white px-4 py-3 text-center dark:bg-ui-surface-dark">
                    <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
                      Orígenes vinculados
                    </dt>
                    <dd className="mt-1 text-base font-extrabold text-slate-950 dark:text-ui-text-dark-strong">
                      {freezingBalanceUseSummary.originCount}
                    </dd>
                  </div>

                  <div className="bg-white px-4 py-3 text-center dark:bg-ui-surface-dark">
                    <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
                      Disponible vinculado
                    </dt>
                    <dd className="number-tabular mt-1 whitespace-nowrap text-sm font-extrabold text-slate-950 dark:text-ui-text-dark-strong">
                      {formatCentiKg(freezingBalanceUseSummary.availableKg100)}
                    </dd>
                  </div>

                  <div className="bg-white px-4 py-3 text-center dark:bg-ui-surface-dark">
                    <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
                      Total utilizado
                    </dt>
                    <dd className="number-tabular mt-1 whitespace-nowrap text-sm font-extrabold text-sky-700 dark:text-sky-300">
                      {formatCentiKg(freezingBalanceUseSummary.usedKg100)}
                    </dd>
                  </div>

                  <div className="bg-white px-4 py-3 text-center dark:bg-ui-surface-dark">
                    <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
                      Saldo restante
                    </dt>
                    <dd className="number-tabular mt-1 whitespace-nowrap text-sm font-extrabold text-amber-700 dark:text-amber-300">
                      {formatCentiKg(freezingBalanceUseSummary.remainingKg100)}
                    </dd>
                  </div>
                </dl>

                <div className="px-4 py-3 sm:px-5">
                  {freezingBalanceUseSummary.reviewCount > 0 ? (
                    <div
                      role="status"
                      className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/[0.08] dark:text-amber-200"
                    >
                      <AlertTriangle
                        className="size-4 shrink-0"
                        aria-hidden="true"
                      />
                      El detalle permanece abierto porque{' '}
                      {freezingBalanceUseSummary.reviewCount}{' '}
                      {freezingBalanceUseSummary.reviewCount === 1
                        ? 'origen requiere'
                        : 'orígenes requieren'}{' '}
                      revisión.
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setIsFreezingOriginsOpen((current) => !current)
                      }
                      aria-expanded={isFreezingOriginsOpen}
                      className="flex w-full items-center justify-between gap-4 rounded-lg px-2 py-2 text-left transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:hover:bg-ui-surface-dark"
                    >
                      <span className="min-w-0">
                        <span className="block text-xs font-extrabold text-slate-900 dark:text-ui-text-dark-strong">
                          Detalle de orígenes vinculados
                        </span>
                        <span className="mt-0.5 block text-[0.6875rem] leading-5 text-slate-500 dark:text-ui-text-dark-soft">
                          Revisa el consumo Día/Noche y el saldo restante de cada
                          jornada origen.
                        </span>
                      </span>

                      <span className="inline-flex shrink-0 items-center gap-2 text-xs font-bold text-brand-700 dark:text-sky-300">
                        {isFreezingOriginsOpen ? 'Ocultar detalle' : 'Ver detalle'}
                        <ChevronDown
                          className={`size-4 transition-transform ${
                            isFreezingOriginsOpen ? 'rotate-180' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {shouldShowBalanceUseDetails ? (
              <div className="divide-y divide-slate-100 dark:divide-ui-line-dark-grid">
                {draft.balanceUses.map((balance, balanceIdx) => {
                  const position = captureBalancePosition(balance)
                  const requiresProductDistribution =
                    balance.requiresProductDistribution === true
                  const productShiftDiagnostics =
                    balanceShiftDiagnostics.filter(
                      (diagnostic) => diagnostic.productId === balance.productId,
                    )

                  return (
                    <div key={balance.key} className="px-4 py-4 sm:px-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-ui-text-dark-strong">
                            {balance.familyName} · {balance.productName}
                          </p>
                          <p className="mt-1 text-[0.6875rem] text-slate-500 dark:text-ui-text-dark-soft">
                            {isFreezing ? 'Origen Envasado' : 'Origen'}:{' '}
                            {balance.originDate
                              ? formatIsoDate(balance.originDate)
                              : balance.originDayId}{' '}
                            ·{' '}
                            {isFreezing
                              ? 'Saldo disponible del origen'
                              : 'Disponible'}
                            : {formatCentiKg(balance.availableKg100)}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveBalanceUse(balance.key)}
                          className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                          aria-label={`Quitar saldo de ${balance.productName}`}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>

                      {requiresProductDistribution ? (
                        <div
                          role="alert"
                          className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 dark:border-amber-500/30 dark:bg-amber-500/10"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <p className="text-[0.6875rem] font-extrabold uppercase tracking-[0.06em] text-amber-900 dark:text-amber-200">
                                Requiere distribución
                              </p>
                              <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-100">
                                Este saldo histórico solo identifica la familia.
                                Selecciona el producto comercial exacto; el
                                sistema no lo asignará automáticamente.
                              </p>
                            </div>

                            <label className="min-w-0 sm:w-[28rem]">
                              <span className="mb-1 block text-[0.6875rem] font-bold text-amber-900 dark:text-amber-200">
                                Producto exacto
                              </span>
                              <select
                                value=""
                                onChange={(event) =>
                                  onDistributeLegacyBalance(
                                    balance.key,
                                    event.target.value,
                                  )
                                }
                                className="h-10 w-full rounded-lg border border-amber-300 bg-white px-3 text-sm text-slate-900 focus:border-brand-400 dark:border-amber-500/30 dark:bg-ui-surface-dark-recessed dark:text-ui-text-dark-strong"
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
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-ui-line-dark dark:bg-ui-surface-dark">
                          <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
                            {isFreezing
                              ? 'Saldo disponible del origen'
                              : 'Disponible'}
                          </p>
                          <p className="number-tabular mt-1 text-sm font-extrabold text-slate-900 dark:text-ui-text-dark-strong">
                            {formatCentiKg(balance.availableKg100)}
                          </p>
                        </div>

                        <QuantityInput
                          label={
                            isFreezing
                              ? 'Utilizado Turno Día'
                              : 'Procesado Día'
                          }
                          value={balance.dayKg}
                          onChange={(value) =>
                            onUpdateBalanceUse(balance.key, 'dayKg', value)
                          }
                          {...getBalancesCellProps(balanceIdx, 0)}
                        />

                        <QuantityInput
                          label={
                            isFreezing
                              ? 'Utilizado Turno Noche'
                              : 'Procesado Noche'
                          }
                          value={balance.nightKg}
                          onChange={(value) =>
                            onUpdateBalanceUse(balance.key, 'nightKg', value)
                          }
                          {...getBalancesCellProps(balanceIdx, 1)}
                        />

                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-ui-line-dark dark:bg-ui-surface-dark">
                          <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
                            {isFreezing ? 'Total utilizado' : 'Total procesado'}
                          </p>
                          <p className="number-tabular mt-1 text-sm font-extrabold text-slate-900 dark:text-ui-text-dark-strong">
                            {formatCentiKg(position.processedKg100)}
                          </p>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-ui-line-dark dark:bg-ui-surface-dark">
                          <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500 dark:text-ui-text-soft">
                            {isFreezing ? 'Saldo restante' : 'Pendiente'}
                          </p>
                          <p
                            className={`number-tabular mt-1 text-sm font-extrabold ${
                              position.overusedKg100 > 0
                                ? 'text-rose-700 dark:text-rose-300'
                                : 'text-slate-900 dark:text-ui-text-dark-strong'
                            }`}
                          >
                            {position.overusedKg100 > 0
                              ? `Exceso ${formatCentiKg(position.overusedKg100)}`
                              : formatCentiKg(position.pendingKg100)}
                          </p>
                        </div>

                        <div className="flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 dark:border-ui-line-dark dark:bg-ui-surface-dark">
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
                          className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200"
                        >
                          <p className="text-[0.6875rem] font-extrabold uppercase tracking-[0.06em]">
                            Saldo anterior mal distribuido
                          </p>
                          {productShiftDiagnostics.map((diagnostic) => (
                            <div
                              key={`${diagnostic.productId}-${diagnostic.shift}`}
                              className="mt-2 text-xs leading-5"
                            >
                              <p className="font-bold">
                                {diagnostic.productName} · Turno{' '}
                                {diagnostic.shift === 'DAY' ? 'Día' : 'Noche'}
                              </p>
                              <p>
                                Reporte físico:{' '}
                                {formatCentiKg(diagnostic.reportedKg100)} · Saldo
                                asignado:{' '}
                                {formatCentiKg(diagnostic.assignedBalanceKg100)}{' '}
                                · Máximo consumible:{' '}
                                {formatCentiKg(
                                  diagnostic.maximumConsumableKg100,
                                )}{' '}
                                · Exceso:{' '}
                                {formatCentiKg(diagnostic.excessKg100)}
                              </p>
                              <p className="mt-1">
                                El saldo asignado supera los kg físicamente
                                reportados para este producto. Redistribuye el
                                consumo entre Día/Noche o deja el remanente
                                pendiente.
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : null}
          </>
        )}
      </fieldset>
    </SectionCard>
  )
}
