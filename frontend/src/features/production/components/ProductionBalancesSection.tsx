import { useState } from 'react'
import { SectionCard } from '../../../components/ui/SectionCard'
import { formatCentiKg, formatIsoDate } from '../../../utils/formatters'
import { captureQuantityKg100 } from '../capture/productionEntryHelpers'
import type { FreezingOriginLedgerRow } from '../capture/freezingOriginLedger'
import type { ProductionCatalogItem } from '../capture/productionCatalog'
import type { ProductionCaptureDraft } from '../capture/productionCapture'
import { useGridKeyboardNavigation } from '../hooks/useGridKeyboardNavigation'
import type { BalanceShiftDiagnostic } from '../model/businessRules'
import { productIdsEquivalent } from '../model/productIdentity'
import {
  Kg100,
  OutstandingBalancePosition,
  ProductionProcess,
} from '../model/types'
import { productionProcessLabels } from '../model/productionProcess'
import { ProductPicker } from './ProductPicker'
import type {
  FreezingBalanceExplanation,
  FreezingBalanceUseSummary,
  FreezingTraceabilitySummary,
} from './balances/balanceTypes'
import { BalanceUseItemRow } from './balances/BalanceUseItemRow'
import { FreezingBalanceExplanationCard } from './balances/FreezingBalanceExplanationCard'
import { FreezingBalanceUseSummaryBar } from './balances/FreezingBalanceUseSummaryBar'
import { FreezingBulkLinkBanner } from './balances/FreezingBulkLinkBanner'
import { FreezingMetricsSummary } from './balances/FreezingMetricsSummary'
import { FreezingOriginLedgerTable } from './balances/FreezingOriginLedgerTable'
import { FreezingTraceabilitySummaryCard } from './balances/FreezingTraceabilitySummaryCard'

export type {
  FreezingBalanceExplanation,
  FreezingBalanceUseSummary,
  FreezingTraceabilitySummary,
} from './balances/balanceTypes'

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

function getPreviousProcessName(selectedProcess: ProductionProcess) {
  if (selectedProcess === 'FREEZING') return 'Envasado'
  if (selectedProcess === 'VIDEOJET') return 'Congelamiento'
  if (selectedProcess === 'PALLETIZING') return 'Videojet'
  return 'Envasado'
}

function getBalanceSectionCopy(
  selectedProcess: ProductionProcess,
  isDownstream: boolean,
  isBalanceOnly: boolean,
  prevProcessName: string,
) {
  if (selectedProcess === 'FREEZING') {
    return {
      title: 'Saldos pendientes de congelar',
      description:
        'Registra los saldos de Envasado de jornadas anteriores que se congelan en esta jornada, indicando los kilos congelados por turno y su fecha de procedencia.',
    }
  }

  if (isDownstream) {
    return {
      title: `Origen y consumo de saldos de ${prevProcessName}`,
      description: `Revisa de qué jornada de ${prevProcessName} proviene cada saldo, cuánto se consume por turno y cuánto queda pendiente. FIFO prioriza los orígenes más antiguos.`,
    }
  }

  return {
    title: 'Saldos anteriores procesados',
    description: isBalanceOnly
      ? 'Fuente principal del domingo: vincula cada kg procesado con su jornada de origen y turno.'
      : 'Si el proceso lo permite, añade saldos de jornadas previas para cuadrar la producción reportada.',
  }
}

function PalletizingTraceabilityNote() {
  return (
    <div className="rounded-xl border border-sky-200/80 bg-sky-50/70 p-3.5 text-xs text-sky-900 dark:border-sky-500/20 dark:bg-sky-950/40 dark:text-sky-200">
      <div className="flex items-center gap-2 font-semibold">
        <span>📦 Trazabilidad y conciliación de Paletizado</span>
      </div>
      <p className="mt-1 text-sky-800/90 dark:text-sky-300">
        Paletizado registra los sacos (20 kg) armados físicamente en pallets. Si Videojet presentó fallas de rotulado o códigos omitidos, la tabla comparativa semanal concilia automáticamente contra la etapa física real (Envasado o Congelamiento) para garantizar un balance exacto.
      </p>
    </div>
  )
}

interface DownstreamBalanceSummaryProps {
  readonly isDownstream: boolean
  readonly freezingPreviousOriginsAvailableKg100: Kg100
  readonly freezingCurrentOriginAvailableKg100: Kg100
  readonly freezingTotalAvailableKg100: Kg100
  readonly totalReportedKg100: Kg100
  readonly freezingLinkedThisDayKg100: Kg100
  readonly freezingPendingAfterKg100: Kg100
  readonly freezingBalanceExplanation: FreezingBalanceExplanation
  readonly freezingPendingLinkCount: number
  readonly prevProcessName: string
  readonly currentProcessName: string
  readonly onOpenBulkFreezingLink: () => void
}

function DownstreamBalanceSummary({
  isDownstream,
  freezingPreviousOriginsAvailableKg100,
  freezingCurrentOriginAvailableKg100,
  freezingTotalAvailableKg100,
  totalReportedKg100,
  freezingLinkedThisDayKg100,
  freezingPendingAfterKg100,
  freezingBalanceExplanation,
  freezingPendingLinkCount,
  prevProcessName,
  currentProcessName,
  onOpenBulkFreezingLink,
}: DownstreamBalanceSummaryProps) {
  if (!isDownstream) return null

  return (
    <>
      <FreezingMetricsSummary
        freezingPreviousOriginsAvailableKg100={freezingPreviousOriginsAvailableKg100}
        freezingCurrentOriginAvailableKg100={freezingCurrentOriginAvailableKg100}
        freezingTotalAvailableKg100={freezingTotalAvailableKg100}
        totalReportedKg100={totalReportedKg100}
        freezingLinkedThisDayKg100={freezingLinkedThisDayKg100}
        freezingPendingAfterKg100={freezingPendingAfterKg100}
        prevProcessName={prevProcessName}
        currentProcessName={currentProcessName}
      />
      <FreezingBalanceExplanationCard
        freezingTotalAvailableKg100={freezingTotalAvailableKg100}
        totalReportedKg100={totalReportedKg100}
        freezingBalanceExplanation={freezingBalanceExplanation}
        freezingPendingAfterKg100={freezingPendingAfterKg100}
        freezingLinkedThisDayKg100={freezingLinkedThisDayKg100}
        prevProcessName={prevProcessName}
        currentProcessName={currentProcessName}
      />
      <FreezingBulkLinkBanner
        freezingPendingLinkCount={freezingPendingLinkCount}
        onOpenBulkFreezingLink={onOpenBulkFreezingLink}
        prevProcessName={prevProcessName}
      />
    </>
  )
}

interface BalanceUseFieldsetProps {
  readonly isDownstream: boolean
  readonly isBalanceOnly: boolean
  readonly usesExternalAvailability: boolean
  readonly reportsReconciled: boolean
  readonly selectedProcess: ProductionProcess
  readonly draft: ProductionCaptureDraft
  readonly availableBalances: readonly OutstandingBalancePosition[]
  readonly freezingAutomaticOriginStartDate: string
  readonly prevProcessName: string
  readonly freezingBalanceUseSummary: FreezingBalanceUseSummary | null
  readonly catalogItems: readonly ProductionCatalogItem[]
  readonly balanceShiftDiagnostics: readonly BalanceShiftDiagnostic[]
  readonly onAddBalance: (balance: OutstandingBalancePosition) => void
  readonly onRemoveBalanceUse: (key: string) => void
  readonly onDistributeLegacyBalance: (key: string, productId: string) => void
  readonly onUpdateBalanceUse: (
    key: string,
    field: 'dayKg' | 'nightKg',
    value: string,
  ) => void
}

type BalancePickerProps = Pick<
  BalanceUseFieldsetProps,
  | 'isDownstream'
  | 'selectedProcess'
  | 'draft'
  | 'availableBalances'
  | 'freezingAutomaticOriginStartDate'
  | 'prevProcessName'
  | 'usesExternalAvailability'
  | 'reportsReconciled'
  | 'onAddBalance'
>

function getBalancePickerCopy(
  selectedProcess: ProductionProcess,
  isDownstream: boolean,
  prevProcessName: string,
  hasAvailableBalances: boolean,
) {
  const isFreezing = selectedProcess === 'FREEZING'
  return {
    label: isFreezing
      ? 'Saldo de Envasado pendiente de congelar'
      : isDownstream
        ? `Vincular origen de ${prevProcessName}`
        : 'Saldo pendiente disponible',
    placeholder: isFreezing
      ? 'Buscar saldo pendiente de Envasado o jornada origen…'
      : isDownstream
        ? 'Buscar jornada origen o producto…'
        : 'Buscar saldo pendiente…',
    buttonLabel: isFreezing
      ? 'Registrar saldo'
      : isDownstream
        ? 'Vincular origen'
        : 'Usar saldo',
    noResultsText: !hasAvailableBalances
      ? isFreezing
        ? 'No hay saldos pendientes de Envasado disponibles para congelar'
        : isDownstream
          ? `No hay producto de ${prevProcessName.toLowerCase()} pendiente`
          : 'No hay otros saldos pendientes disponibles'
      : 'Sin saldos coincidentes',
  }
}

function BalancePicker({
  isDownstream,
  selectedProcess,
  draft,
  availableBalances,
  freezingAutomaticOriginStartDate,
  prevProcessName,
  usesExternalAvailability,
  reportsReconciled,
  onAddBalance,
}: BalancePickerProps) {
  const copy = getBalancePickerCopy(
    selectedProcess,
    isDownstream,
    prevProcessName,
    availableBalances.length > 0,
  )
  const isDisabled = !usesExternalAvailability && !reportsReconciled

  return (
    <ProductPicker
      items={availableBalances}
      getItemId={(balance) => `${balance.originDayId}|${balance.productId}`}
      getItemRecentId={(balance) => balance.productId}
      getItemLabel={(balance) =>
        `${formatIsoDate(balance.originDate)} · ${balance.familyName} · ${balance.productName}`
      }
      getItemMeta={(balance) => ({
        group: isDownstream
          ? balance.originDate === draft.date
            ? `JORNADA ACTUAL DE ${prevProcessName.toUpperCase()}`
            : balance.originDate >= freezingAutomaticOriginStartDate &&
                balance.originDate < draft.date
              ? 'JORNADAS ANTERIORES CON SALDO'
              : 'HISTÓRICO · VINCULACIÓN MANUAL'
          : balance.familyName,
        secondaryText: formatCentiKg(balance.pendingKg100),
      })}
      onAdd={onAddBalance}
      label={copy.label}
      placeholder={copy.placeholder}
      buttonLabel={copy.buttonLabel}
      disabled={isDisabled}
      scopeKey={`${selectedProcess}:REPORTS`}
      noResultsText={copy.noResultsText}
    />
  )
}

type BalanceUseRowsProps = Pick<
  BalanceUseFieldsetProps,
  | 'isDownstream'
  | 'draft'
  | 'prevProcessName'
  | 'freezingBalanceUseSummary'
  | 'catalogItems'
  | 'balanceShiftDiagnostics'
  | 'onRemoveBalanceUse'
  | 'onDistributeLegacyBalance'
  | 'onUpdateBalanceUse'
> & {
  readonly isBalanceOnly: boolean
}

function BalanceUseRows({
  isDownstream,
  isBalanceOnly,
  draft,
  prevProcessName,
  freezingBalanceUseSummary,
  catalogItems,
  balanceShiftDiagnostics,
  onRemoveBalanceUse,
  onDistributeLegacyBalance,
  onUpdateBalanceUse,
}: BalanceUseRowsProps) {
  const [isFreezingOriginsOpen, setIsFreezingOriginsOpen] = useState(false)
  const { getGridCellProps: getBalancesCellProps } = useGridKeyboardNavigation({
    totalRows: draft.balanceUses.length,
    columns: 2,
    gridId: 'balances-grid',
  })

  if (draft.balanceUses.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-ui-text-dark-soft">
        {isDownstream
          ? `No se ha vinculado producto disponible desde ${prevProcessName}.`
          : 'No se han asignado saldos de jornadas anteriores.'}
      </p>
    )
  }

  return (
    <>
      {isDownstream && freezingBalanceUseSummary ? (
        <FreezingBalanceUseSummaryBar
          summary={freezingBalanceUseSummary}
          isOpen={isFreezingOriginsOpen}
          onToggle={() => setIsFreezingOriginsOpen((current) => !current)}
        />
      ) : null}
      <div className="divide-y divide-slate-100 dark:divide-ui-line-dark-grid">
        {draft.balanceUses.map((balance, balanceIdx) => {
          const sourceProductId = balance.sourceProductId ?? balance.productId
          const productRows = draft.rows.filter(
            (row) =>
              productIdsEquivalent(row.product.productId, balance.productId) ||
              productIdsEquivalent(row.product.productId, sourceProductId),
          )
          const dayShiftAvailable =
            isBalanceOnly ||
            productRows.some(
              (row) => captureQuantityKg100(row.dayReportedKg) > 0,
            )
          const nightShiftAvailable =
            isBalanceOnly ||
            productRows.some(
              (row) => captureQuantityKg100(row.nightReportedKg) > 0,
            )

          return (
            <BalanceUseItemRow
              key={balance.key}
              balance={balance}
              balanceIdx={balanceIdx}
              isFreezing={isDownstream}
              prevProcessName={prevProcessName}
              catalogItems={catalogItems}
              balanceShiftDiagnostics={balanceShiftDiagnostics}
              dayShiftAvailable={dayShiftAvailable}
              nightShiftAvailable={nightShiftAvailable}
              onRemoveBalanceUse={onRemoveBalanceUse}
              onDistributeLegacyBalance={onDistributeLegacyBalance}
              onUpdateBalanceUse={onUpdateBalanceUse}
              getBalancesCellProps={getBalancesCellProps}
            />
          )
        })}
      </div>
    </>
  )
}

function BalanceUseFieldset({
  isDownstream,
  isBalanceOnly,
  usesExternalAvailability,
  reportsReconciled,
  selectedProcess,
  draft,
  availableBalances,
  freezingAutomaticOriginStartDate,
  prevProcessName,
  freezingBalanceUseSummary,
  catalogItems,
  balanceShiftDiagnostics,
  onAddBalance,
  onRemoveBalanceUse,
  onDistributeLegacyBalance,
  onUpdateBalanceUse,
}: BalanceUseFieldsetProps) {
  const isDisabled = !usesExternalAvailability && !reportsReconciled

  return (
    <fieldset disabled={isDisabled} className="min-w-0 disabled:opacity-65">
      <legend className="sr-only">Consumo de saldos anteriores</legend>
      <BalancePicker
        isDownstream={isDownstream}
        selectedProcess={selectedProcess}
        draft={draft}
        availableBalances={availableBalances}
        freezingAutomaticOriginStartDate={freezingAutomaticOriginStartDate}
        prevProcessName={prevProcessName}
        usesExternalAvailability={usesExternalAvailability}
        reportsReconciled={reportsReconciled}
        onAddBalance={onAddBalance}
      />
      <BalanceUseRows
        isDownstream={isDownstream}
        isBalanceOnly={isBalanceOnly}
        draft={draft}
        prevProcessName={prevProcessName}
        freezingBalanceUseSummary={freezingBalanceUseSummary}
        catalogItems={catalogItems}
        balanceShiftDiagnostics={balanceShiftDiagnostics}
        onRemoveBalanceUse={onRemoveBalanceUse}
        onDistributeLegacyBalance={onDistributeLegacyBalance}
        onUpdateBalanceUse={onUpdateBalanceUse}
      />
    </fieldset>
  )
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
  const isDownstream = isFreezing || selectedProcess !== 'PACKING'
  const prevProcessName = getPreviousProcessName(selectedProcess)
  const currentProcessName =
    productionProcessLabels[selectedProcess] ?? 'Congelamiento'

  const sectionCopy = getBalanceSectionCopy(
    selectedProcess,
    isDownstream,
    isBalanceOnly,
    prevProcessName,
  )

  return (
    <SectionCard
      allowStickyContent
      title={sectionCopy.title}
      description={
        selectedProcess === 'FREEZING'
          ? 'Registra los saldos de Envasado de jornadas anteriores que se congelan en esta jornada, indicando los kilos congelados por turno y su fecha de procedencia.'
          : isDownstream
            ? `Revisa de qué jornada de ${prevProcessName} proviene cada saldo, cuánto se consume por turno y cuánto queda pendiente. FIFO prioriza los orígenes más antiguos.`
            : isBalanceOnly
              ? 'Fuente principal del domingo: vincula cada kg procesado con su jornada de origen y turno.'
              : 'Si el proceso lo permite, añade saldos de jornadas previas para cuadrar la producción reportada.'
      }
    >
      {selectedProcess === 'PALLETIZING' ? <PalletizingTraceabilityNote /> : null}
      <DownstreamBalanceSummary
        isDownstream={isDownstream}
        freezingPreviousOriginsAvailableKg100={freezingPreviousOriginsAvailableKg100}
        freezingCurrentOriginAvailableKg100={freezingCurrentOriginAvailableKg100}
        freezingTotalAvailableKg100={freezingTotalAvailableKg100}
        totalReportedKg100={totalReportedKg100}
        freezingLinkedThisDayKg100={freezingLinkedThisDayKg100}
        freezingPendingAfterKg100={freezingPendingAfterKg100}
        freezingBalanceExplanation={freezingBalanceExplanation}
        freezingPendingLinkCount={freezingPendingLinkCount}
        prevProcessName={prevProcessName}
        currentProcessName={currentProcessName}
        onOpenBulkFreezingLink={onOpenBulkFreezingLink}
      />

      <BalanceUseFieldset
        isDownstream={isDownstream}
        isBalanceOnly={isBalanceOnly}
        usesExternalAvailability={usesExternalAvailability}
        reportsReconciled={reportsReconciled}
        selectedProcess={selectedProcess}
        draft={draft}
        availableBalances={availableBalances}
        freezingAutomaticOriginStartDate={freezingAutomaticOriginStartDate}
        prevProcessName={prevProcessName}
        freezingBalanceUseSummary={freezingBalanceUseSummary}
        catalogItems={catalogItems}
        balanceShiftDiagnostics={balanceShiftDiagnostics}
        onAddBalance={onAddBalance}
        onRemoveBalanceUse={onRemoveBalanceUse}
        onDistributeLegacyBalance={onDistributeLegacyBalance}
        onUpdateBalanceUse={onUpdateBalanceUse}
      />
      {isDownstream && freezingOriginLedger.length > 0 ? (
        <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs dark:border-ui-line-dark dark:bg-ui-surface-dark">
          <summary className="cursor-pointer font-bold text-slate-700 select-none hover:text-slate-900 dark:text-ui-text-dark dark:hover:text-white">
            📊 Auditoría de trazabilidad y libro de orígenes de {prevProcessName} ({freezingOriginLedger.length})
          </summary>
          <div className="mt-3 space-y-3">
            <FreezingTraceabilitySummaryCard
              summary={freezingTraceabilitySummary}
              prevProcessName={prevProcessName}
              currentProcessName={currentProcessName}
            />
            <FreezingOriginLedgerTable
              freezingOriginLedger={freezingOriginLedger}
              prevProcessName={prevProcessName}
              currentProcessName={currentProcessName}
            />
          </div>
        </details>
      ) : null}
    </SectionCard>
  )
}
