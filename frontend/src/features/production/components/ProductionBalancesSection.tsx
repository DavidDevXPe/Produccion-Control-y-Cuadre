import { useState } from 'react'
import { SectionCard } from '../../../components/ui/SectionCard'
import { formatCentiKg, formatIsoDate } from '../../../utils/formatters'
import type { FreezingOriginLedgerRow } from '../capture/freezingOriginLedger'
import type { ProductionCatalogItem } from '../capture/productionCatalog'
import type { ProductionCaptureDraft } from '../capture/productionCapture'
import { useGridKeyboardNavigation } from '../hooks/useGridKeyboardNavigation'
import type { BalanceShiftDiagnostic } from '../model/businessRules'
import type {
  Kg100,
  OutstandingBalancePosition,
  ProductionProcess,
} from '../model/types'
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

  const shouldShowBalanceUseDetails =
    !isFreezing ||
    isFreezingOriginsOpen ||
    (freezingBalanceUseSummary?.reviewCount ?? 0) > 0

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
            : 'Si el proceso lo permite, añade saldos de jornadas previas para cuadrar la producción reportada.'
      }
    >
      {isFreezing ? (
        <FreezingMetricsSummary
          freezingPreviousOriginsAvailableKg100={freezingPreviousOriginsAvailableKg100}
          freezingCurrentOriginAvailableKg100={freezingCurrentOriginAvailableKg100}
          freezingTotalAvailableKg100={freezingTotalAvailableKg100}
          totalReportedKg100={totalReportedKg100}
          freezingLinkedThisDayKg100={freezingLinkedThisDayKg100}
          freezingPendingAfterKg100={freezingPendingAfterKg100}
        />
      ) : null}

      {isFreezing ? (
        <FreezingBalanceExplanationCard
          freezingTotalAvailableKg100={freezingTotalAvailableKg100}
          totalReportedKg100={totalReportedKg100}
          freezingBalanceExplanation={freezingBalanceExplanation}
          freezingPendingAfterKg100={freezingPendingAfterKg100}
          freezingLinkedThisDayKg100={freezingLinkedThisDayKg100}
        />
      ) : null}

      {isFreezing ? (
        <FreezingBulkLinkBanner
          freezingPendingLinkCount={freezingPendingLinkCount}
          onOpenBulkFreezingLink={onOpenBulkFreezingLink}
        />
      ) : null}

      {isFreezing ? (
        <FreezingTraceabilitySummaryCard
          summary={freezingTraceabilitySummary}
        />
      ) : null}

      {isFreezing ? (
        <FreezingOriginLedgerTable
          freezingOriginLedger={freezingOriginLedger}
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
                    isFreezing={isFreezing}
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
    </SectionCard>
  )
}
