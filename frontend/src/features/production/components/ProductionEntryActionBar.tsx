import { AlertTriangle, CheckCircle2, Save } from 'lucide-react'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { buttonStyles } from '../../../components/ui/buttonStyles'
import { formatCentiKg } from '../../../utils/formatters'
import { kg100 } from '../model/calculations'
import type { Kg100 } from '../model/types'

export interface ShiftSummaryData {
  reportedKg100: Kg100
  /** Kept for API compatibility; footer reconciliation uses the report detail. */
  ownProductionKg100?: Kg100
  tunnelProductionKg100?: Kg100
  declaredReportedKg100: Kg100
  detailDifferenceKg100: Kg100
}

export interface ProductionEntryActionBarProps {
  canClose: boolean
  footerStatus: { title: string; description: string }
  pendingClosureReasons: readonly string[]
  reviewReasons?: readonly string[]
  dayShift: ShiftSummaryData
  nightShift: ShiftSummaryData
  dayHasReportData: boolean
  nightHasReportData: boolean
  onSaveDraft: () => void
  onCloseDay: () => void
}

interface ShiftIndicatorProps {
  readonly label: 'Día' | 'Noche'
  readonly shift: ShiftSummaryData
  readonly hasData: boolean
}

function ShiftIndicator({ label, shift, hasData }: ShiftIndicatorProps) {
  const reconciled = hasData && shift.detailDifferenceKg100 === 0
  const reconciledTotalKg100 = kg100(
    shift.reportedKg100 + (shift.tunnelProductionKg100 ?? 0),
  )
  const registered = formatCentiKg(reconciledTotalKg100)
  const reported = hasData ? formatCentiKg(shift.declaredReportedKg100) : '—'
  const difference = hasData ? formatCentiKg(shift.detailDifferenceKg100) : '—'
  const tooltipText = reconciled
    ? `Turno ${label} conciliado`
    : hasData
      ? `Turno ${label}: revisar diferencia ${difference}`
      : `Turno ${label} sin reporte`

  return (
    <div
      data-testid={`sticky-shift-chip-${label.toLowerCase()}`}
      data-tooltip={tooltipText}
      aria-label={tooltipText}
      role="status"
      tabIndex={0}
      className={`production-entry-action-bar__shift-indicator inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[0.6875rem] font-bold ${reconciled ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}
      title={`${tooltipText}. ${registered} registrados / ${reported} reportados · Diferencia ${difference}`}
    >
      {reconciled ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : <AlertTriangle className="size-3.5" aria-hidden="true" />}
      <span>{label}</span>
      <span className="sr-only">{reconciled ? 'CONCILIADO' : 'REVISAR'}</span>
    </div>
  )
}

function getGeneralTitle(
  canClose: boolean,
  productionReconciled: boolean,
  hasReportData: boolean,
  hasWarningsOnly: boolean,
) {
  if (canClose) return hasWarningsOnly ? 'Lista con observaciones' : 'Lista para cerrar'
  if (productionReconciled) return 'Cierre pendiente'
  return hasReportData ? 'Requiere revisión' : 'Cierre pendiente'
}

function getPendingLabel(
  reviewReasons: readonly string[],
  pendingClosureReasons: readonly string[],
  hasWarningsOnly: boolean,
) {
  if (reviewReasons.length === 0) return ''
  if (hasWarningsOnly) {
    return `${reviewReasons.length} ${reviewReasons.length === 1 ? 'observación para revisar' : 'observaciones para revisar'}`
  }
  return `${pendingClosureReasons.length} ${pendingClosureReasons.length === 1 ? 'validación para el cierre' : 'validaciones para el cierre'}`
}

interface ActionBarStatusProps {
  readonly canClose: boolean
  readonly title: string
  readonly pendingLabel: string
  readonly hasWarningsOnly: boolean
  readonly description: string
}

function ActionBarStatus({
  canClose,
  title,
  pendingLabel,
  hasWarningsOnly,
  description,
}: ActionBarStatusProps) {
  const requiresAttention = !canClose || hasWarningsOnly

  return (
    <div
      className="production-entry-action-bar__status flex min-w-0 items-center gap-2.5"
      role="status"
      aria-live="polite"
      aria-label={`${title}. ${description}`}
      title={description}
    >
      {!requiresAttention ? (
        <CheckCircle2
          className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
      ) : (
        <AlertTriangle
          className="size-5 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
      )}
      <div className="min-w-0">
        <p className="truncate text-[0.8125rem] font-extrabold leading-4 text-slate-900 dark:text-ui-text-dark-strong">
          {title}
        </p>
        {pendingLabel ? (
          <p className="truncate text-[0.6875rem] text-amber-700 dark:text-amber-300">
            {pendingLabel}
          </p>
        ) : null}
      </div>
    </div>
  )
}

interface ActionBarActionsProps {
  readonly reviewReasons: readonly string[]
  readonly pendingClosureReasons: readonly string[]
  readonly hasWarningsOnly: boolean
  readonly isPendingPanelOpen: boolean
  readonly pendingTriggerRef: RefObject<HTMLButtonElement | null>
  readonly pendingPanelRef: RefObject<HTMLDialogElement | null>
  readonly onTogglePendingPanel: () => void
  readonly onClosePendingPanel: () => void
  readonly onOpenReview: () => void
  readonly onSaveDraft: () => void
  readonly onCloseDay: () => void
  readonly canClose: boolean
}

function ActionBarActions({
  reviewReasons,
  pendingClosureReasons,
  hasWarningsOnly,
  isPendingPanelOpen,
  pendingTriggerRef,
  pendingPanelRef,
  onTogglePendingPanel,
  onSaveDraft,
  onCloseDay,
  canClose,
  onClosePendingPanel,
  onOpenReview,
}: ActionBarActionsProps) {
  return (
    <div className="production-entry-action-bar__actions relative flex min-w-0 items-center gap-2">
      {reviewReasons.length > 0 ? (
        <button
          ref={pendingTriggerRef}
          type="button"
          aria-expanded={isPendingPanelOpen}
          aria-controls="sticky-pending-panel"
          onClick={onTogglePendingPanel}
          className={`${buttonStyles('ghost', 'sm')} whitespace-nowrap border-brand-500/25 bg-brand-500/5 font-semibold text-brand-700 hover:bg-brand-500/10 dark:border-sky-400/30 dark:bg-sky-400/5 dark:text-sky-300 dark:hover:bg-sky-400/10`}
        >
          {hasWarningsOnly
            ? `Revisar observaciones (${reviewReasons.length})`
            : `Revisar pendientes (${pendingClosureReasons.length})`}
        </button>
      ) : null}
      <button
        type="button"
        onClick={onSaveDraft}
        className={`${buttonStyles('secondary', 'sm')} whitespace-nowrap`}
      >
        <Save className="size-4 shrink-0" aria-hidden="true" />
        Guardar borrador
      </button>
      <button
        type="button"
        disabled={!canClose}
        onClick={onCloseDay}
        className={`${buttonStyles('primary', 'sm')} whitespace-nowrap`}
      >
        <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
        Cerrar jornada
      </button>
      <PendingPanel
        isOpen={isPendingPanelOpen}
        reasons={reviewReasons}
        hasWarningsOnly={hasWarningsOnly}
        pendingPanelRef={pendingPanelRef}
        onClose={onClosePendingPanel}
        onOpenReview={onOpenReview}
      />
    </div>
  )
}

interface PendingPanelProps {
  readonly isOpen: boolean
  readonly reasons: readonly string[]
  readonly hasWarningsOnly: boolean
  readonly pendingPanelRef: RefObject<HTMLDialogElement | null>
  readonly onClose: () => void
  readonly onOpenReview: () => void
}

function PendingPanel({
  isOpen,
  reasons,
  hasWarningsOnly,
  pendingPanelRef,
  onClose,
  onOpenReview,
}: PendingPanelProps) {
  if (!isOpen || reasons.length === 0) return null

  const reviewTargetAvailable =
    typeof document !== 'undefined' &&
    document.getElementById('pendientes-para-cerrar')

  return (
    <dialog
      open
      ref={pendingPanelRef}
      id="sticky-pending-panel"
      aria-label={
        hasWarningsOnly ? 'Observaciones para revisar' : 'Validaciones para el cierre'
      }
      className="absolute bottom-[calc(100%+0.75rem)] left-auto top-auto right-0 m-0 max-h-[min(60vh,22rem)] w-[min(30rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-ui-line-dark dark:bg-ui-surface-dark-deep"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-slate-900 dark:text-ui-text-dark-strong">
          {hasWarningsOnly ? 'Observaciones para revisar' : 'Validaciones para el cierre'}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-slate-900 dark:text-ui-text-dark-soft dark:hover:text-white"
        >
          Cerrar
        </button>
      </div>
      <ul className="space-y-1.5">
        {reasons.map((reason) => (
          <li
            key={reason}
            className="flex items-start gap-2 rounded-lg border border-slate-200 px-2.5 py-2 dark:border-ui-line-dark"
          >
            <AlertTriangle
              className="mt-0.5 size-3.5 shrink-0 text-amber-500"
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 text-xs leading-4 text-slate-700 dark:text-ui-text-dark-pale">
              {reason}
            </span>
            {reviewTargetAvailable ? (
              <button
                type="button"
                onClick={onOpenReview}
                className="shrink-0 text-[0.6875rem] font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-sky-300 dark:hover:text-sky-200"
              >
                Ir a revisar
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </dialog>
  )
}

export function ProductionEntryActionBar({
  canClose,
  footerStatus,
  pendingClosureReasons,
  reviewReasons: providedReviewReasons,
  dayShift,
  nightShift,
  dayHasReportData,
  nightHasReportData,
  onSaveDraft,
  onCloseDay,
}: ProductionEntryActionBarProps) {
  const reviewReasons = providedReviewReasons ?? pendingClosureReasons
  const [isPendingPanelOpen, setIsPendingPanelOpen] = useState(false)
  const pendingPanelRef = useRef<HTMLDialogElement>(null)
  const pendingTriggerRef = useRef<HTMLButtonElement>(null)
  const shifts = [
    { label: 'Día' as const, shift: dayShift, hasData: dayHasReportData },
    { label: 'Noche' as const, shift: nightShift, hasData: nightHasReportData },
  ]
  const productionReconciled = shifts.every(
    ({ hasData, shift }) => hasData && shift.detailDifferenceKg100 === 0,
  )
  const hasWarningsOnly = canClose && reviewReasons.length > 0
  const generalTitle = getGeneralTitle(
    canClose,
    productionReconciled,
    dayHasReportData || nightHasReportData,
    hasWarningsOnly,
  )
  const pendingLabel = getPendingLabel(
    reviewReasons,
    pendingClosureReasons,
    hasWarningsOnly,
  )

  useEffect(() => {
    if (!isPendingPanelOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsPendingPanelOpen(false)
    }
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        !pendingPanelRef.current?.contains(target) &&
        !pendingTriggerRef.current?.contains(target)
      ) {
        setIsPendingPanelOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isPendingPanelOpen])

  const openPendingDetails = () => {
    setIsPendingPanelOpen(false)
    const target = document.getElementById('pendientes-para-cerrar')
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    target?.focus()
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 shadow-[0_-8px_30px_rgb(15_23_42/0.08)] backdrop-blur dark:border-ui-line-dark dark:bg-ui-surface-dark-deep lg:left-64 lg:h-[var(--sidebar-footer-height)]">
      <div className="production-entry-action-bar__layout relative mx-auto min-h-14 w-full max-w-[92.5rem] px-4 py-2 sm:px-5 lg:h-full lg:min-h-0 lg:px-4 lg:py-0 xl:px-7 2xl:px-8">
        <ActionBarStatus
          canClose={canClose}
          title={generalTitle}
          pendingLabel={pendingLabel}
          hasWarningsOnly={hasWarningsOnly}
        description={footerStatus.description}
        />

        <div className="production-entry-action-bar__shifts flex items-center justify-start gap-2" role="group" aria-label="Estado de turnos">
          {shifts.map((shiftData) => (
            <ShiftIndicator key={shiftData.label} {...shiftData} />
          ))}
        </div>

        <ActionBarActions
          reviewReasons={reviewReasons}
          pendingClosureReasons={pendingClosureReasons}
          hasWarningsOnly={hasWarningsOnly}
          isPendingPanelOpen={isPendingPanelOpen}
          pendingTriggerRef={pendingTriggerRef}
          pendingPanelRef={pendingPanelRef}
          onTogglePendingPanel={() => setIsPendingPanelOpen((open) => !open)}
          onClosePendingPanel={() => setIsPendingPanelOpen(false)}
          onOpenReview={openPendingDetails}
          onSaveDraft={onSaveDraft}
          onCloseDay={onCloseDay}
          canClose={canClose}
        />
      </div>
    </div>
  )
}
