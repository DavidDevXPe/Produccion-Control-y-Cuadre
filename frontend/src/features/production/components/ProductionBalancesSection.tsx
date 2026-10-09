import { useState } from 'react'
import { SectionCard } from '../../../components/ui/SectionCard'
import { formatCentiKg, formatIsoDate } from '../../../utils/formatters'
import type { FreezingOriginLedgerRow } from '../capture/freezingOriginLedger'
import type { ProductionCatalogItem } from '../capture/productionCatalog'
import type { ProductionCaptureDraft } from '../capture/productionCapture'
import { useGridKeyboardNavigation } from '../hooks/useGridKeyboardNavigation'
import type { BalanceShiftDiagnostic } from '../model/businessRules'
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

  const isDownstream = isFreezing || selectedProcess !== 'PACKING'
  const prevProcessName =
    selectedProcess === 'FREEZING'
      ? 'Envasado'
      : selectedProcess === 'VIDEOJET'
        ? 'Congelamiento'
        : selectedProcess === 'PALLETIZING'
          ? 'Videojet'
          : 'Envasado'

  const currentProcessName =
    productionProcessLabels[selectedProcess] ?? 'Congelamiento'

  const shouldShowBalanceUseDetails = true

  return (
    <SectionCard
      allowStickyContent
      title={
        selectedProcess === 'FREEZING'
          ? 'Saldos pendientes de congelar'
          : isDownstream
            ? `Origen y consumo de saldos de ${prevProcessName}`
            : 'Saldos anteriores procesados'
      }
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
      {selectedProcess === 'PALLETIZING' ? (
        <div className="rounded-xl border border-sky-200/80 bg-sky-50/70 p-3.5 text-xs text-sky-900 dark:border-sky-500/20 dark:bg-sky-950/40 dark:text-sky-200">
          <div className="flex items-center gap-2 font-semibold">
            <span>📦 Trazabilidad y conciliación de Paletizado</span>
          </div>
          <p className="mt-1 text-sky-800/90 dark:text-sky-300">
            Paletizado registra los sacos (20 kg) armados físicamente en pallets. Si Videojet presentó fallas de rotulado o códigos omitidos, la tabla comparativa semanal concilia automáticamente contra la etapa física real (Envasado o Congelamiento) para garantizar un balance exacto.
          </p>
        </div>
      ) : null}

      {isDownstream ? (
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
      ) : null}

      {isDownstream ? (
        <FreezingBalanceExplanationCard
          freezingTotalAvailableKg100={freezingTotalAvailableKg100}
          totalReportedKg100={totalReportedKg100}
          freezingBalanceExplanation={freezingBalanceExplanation}
          freezingPendingAfterKg100={freezingPendingAfterKg100}
          freezingLinkedThisDayKg100={freezingLinkedThisDayKg100}
          prevProcessName={prevProcessName}
          currentProcessName={currentProcessName}
        />
      ) : null}

      {isDownstream ? (
        <FreezingBulkLinkBanner
          freezingPendingLinkCount={freezingPendingLinkCount}
          onOpenBulkFreezingLink={onOpenBulkFreezingLink}
          prevProcessName={prevProcessName}
        />
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
          onAdd={(balance) => onAddBalance(balance)}
          label={
            selectedProcess === 'FREEZING'
              ? 'Saldo de Envasado pendiente de congelar'
              : isDownstream
                ? `Vincular origen de ${prevProcessName}`
                : 'Saldo pendiente disponible'
          }
          placeholder={
            selectedProcess === 'FREEZING'
              ? 'Buscar saldo pendiente de Envasado o jornada origen…'
              : isDownstream
                ? 'Buscar jornada origen o producto…'
                : 'Buscar saldo pendiente…'
          }
          buttonLabel={
            selectedProcess === 'FREEZING'
              ? 'Registrar saldo'
              : isDownstream
                ? 'Vincular origen'
                : 'Usar saldo'
          }
          disabled={!usesExternalAvailability && !reportsReconciled}
          scopeKey={`${selectedProcess}:BALANCES`}
          noResultsText={
            availableBalances.length === 0
              ? selectedProcess === 'FREEZING'
                ? 'No hay saldos pendientes de Envasado disponibles para congelar'
                : isDownstream
                  ? `No hay producto de ${prevProcessName.toLowerCase()} pendiente`
                  : 'No hay otros saldos pendientes disponibles'
              : 'Sin saldos coincidentes'
          }
        />

        {draft.balanceUses.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-ui-text-dark-soft">
            {isDownstream
              ? `No se ha vinculado producto disponible desde ${prevProcessName}.`
              : 'No se han asignado saldos de jornadas anteriores.'}
          </p>
        ) : (
          <>
            {isDownstream && freezingBalanceUseSummary ? (
              <FreezingBalanceUseSummaryBar
                summary={freezingBalanceUseSummary}
                isOpen={isFreezingOriginsOpen}
                onToggle={() => setIsFreezingOriginsOpen((current) => !current)}
              />
            ) : null}

            {shouldShowBalanceUseDetails ? (
              <div className="divide-y divide-slate-100 dark:divide-ui-line-dark-grid">
                {draft.balanceUses.map((balance, balanceIdx) => (
                  <BalanceUseItemRow
                    key={balance.key}
                    balance={balance}
                    balanceIdx={balanceIdx}
                    isFreezing={isDownstream}
                    prevProcessName={prevProcessName}
                    catalogItems={catalogItems}
                    balanceShiftDiagnostics={balanceShiftDiagnostics}
                    onRemoveBalanceUse={onRemoveBalanceUse}
                    onDistributeLegacyBalance={onDistributeLegacyBalance}
                    onUpdateBalanceUse={onUpdateBalanceUse}
                    getBalancesCellProps={getBalancesCellProps}
                  />
                ))}
              </div>
            ) : null}
          </>
        )}
      </fieldset>

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
