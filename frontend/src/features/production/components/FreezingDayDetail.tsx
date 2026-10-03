import { kg100, sumKg100 } from '../model/calculations'
import { calculateFrozenPhysicalKg100 } from '../model/freezing'
import { getProductionDayOperationalState } from '../model/productionLifecycle'
import type { ProductionDay } from '../model/types'
import { FreezingClosureWarningsCard } from './freezingDayDetail/FreezingClosureWarningsCard'
import { FreezingDayDetailHeader } from './freezingDayDetail/FreezingDayDetailHeader'
import { FreezingFifoOriginTable } from './freezingDayDetail/FreezingFifoOriginTable'
import { FreezingKpiGrid } from './freezingDayDetail/FreezingKpiGrid'
import { FreezingOriginCompositionCard } from './freezingDayDetail/FreezingOriginCompositionCard'
import { FreezingProductsTable } from './freezingDayDetail/FreezingProductsTable'
import { FreezingReportReconciliationCard } from './freezingDayDetail/FreezingReportReconciliationCard'

export interface FreezingDayDetailProps {
  productionDay: ProductionDay
  allProductionDays: readonly ProductionDay[]
  canEdit: boolean
  canClose: boolean
  canExport?: boolean
  exportState?: 'IDLE' | 'EXPORTING' | 'SUCCESS' | 'ERROR'
  onClose: () => void
  onExportPdf?: () => void
  onExportExcel?: () => void
}

export function FreezingDayDetail({
  productionDay,
  allProductionDays,
  canEdit,
  canClose,
  canExport = false,
  exportState = 'IDLE',
  onClose,
  onExportPdf,
  onExportExcel,
}: FreezingDayDetailProps) {
  const operationalState = getProductionDayOperationalState(productionDay)
  const calculation = operationalState.calculation
  const physicalKg100 = calculateFrozenPhysicalKg100(productionDay)
  const linkedKg100 = calculation.processedPreviousBalanceKg100
  const differenceKg100 = kg100(physicalKg100 - linkedKg100)
  const isBalanced = operationalState.isBalanced && differenceKg100 === 0
  const isClosed = operationalState.lifecycle === 'CLOSED'
  const isReadyToClose = operationalState.state === 'READY_TO_CLOSE'
  const hasClosureWarnings = operationalState.validation.warnings.length > 0
  const reconciliationObserved = differenceKg100 !== 0 && hasClosureWarnings

  const freezingOriginRows = productionDay.receivedBalanceLots.map((lot) => {
    const line = productionDay.lines.find(
      (candidate) => candidate.productId === lot.productId,
    )
    const originDay = allProductionDays.find(
      (candidate) => candidate.id === lot.originDayId,
    )
    const usedKg100 = sumKg100(lot.uses.map((use) => use.kg100))
    const pendingKg100 = kg100(Math.max(lot.originalKg100 - usedKg100, 0))
    const originDate = originDay?.date
    const originKind =
      originDate && originDate < productionDay.date
        ? ('PREVIOUS' as const)
        : originDate === productionDay.date
          ? ('CURRENT' as const)
          : ('UNKNOWN' as const)

    return {
      lot,
      line,
      originDay,
      usedKg100,
      pendingKg100,
      originKind,
    }
  })

  const previousOriginUsedKg100 = sumKg100(
    freezingOriginRows
      .filter((row) => row.originKind === 'PREVIOUS')
      .map((row) => row.usedKg100),
  )

  const currentOriginUsedKg100 = sumKg100(
    freezingOriginRows
      .filter((row) => row.originKind === 'CURRENT')
      .map((row) => row.usedKg100),
  )

  const unsupportedFrozenKg100 = kg100(Math.max(differenceKg100, 0))
  const excessLinkedKg100 = kg100(Math.max(-differenceKg100, 0))
  const hasTraceabilityDifference = differenceKg100 !== 0
  const traceabilityDifferenceLabel =
    excessLinkedKg100 > 0
      ? 'Vinculado en exceso'
      : unsupportedFrozenKg100 > 0
        ? 'Sin origen suficiente'
        : 'Diferencia de trazabilidad'

  const statusBadge = isClosed
    ? hasClosureWarnings
      ? { tone: 'warning' as const, label: 'CERRADA · CON OBSERVACIONES' }
      : isBalanced
        ? { tone: 'success' as const, label: 'CERRADA · SOLO LECTURA' }
        : { tone: 'danger' as const, label: 'CERRADA · REVISAR' }
    : isReadyToClose
      ? hasClosureWarnings
        ? { tone: 'warning' as const, label: 'LISTA · CON OBSERVACIONES' }
        : { tone: 'success' as const, label: 'LISTA PARA CERRAR' }
      : { tone: 'warning' as const, label: 'BORRADOR · REVISAR' }

  return (
    <div className="space-y-5">
      <FreezingDayDetailHeader
        productionDay={productionDay}
        statusBadge={statusBadge}
        canEdit={canEdit}
        canClose={canClose}
        canExport={canExport}
        exportState={exportState}
        onClose={onClose}
        onExportPdf={onExportPdf}
        onExportExcel={onExportExcel}
      />

      <FreezingClosureWarningsCard
        isClosed={isClosed}
        warnings={operationalState.validation.warnings}
      />

      <FreezingKpiGrid
        dayShiftDay={productionDay.declaredShiftTotalsKg100.DAY}
        dayShiftNight={productionDay.declaredShiftTotalsKg100.NIGHT}
        physicalKg100={physicalKg100}
        differenceKg100={differenceKg100}
      />

      <FreezingReportReconciliationCard
        isBalanced={isBalanced}
        reconciliationObserved={reconciliationObserved}
        dayReportedKg100={calculation.day.reportedKg100}
        nightReportedKg100={calculation.night.reportedKg100}
        linkedKg100={linkedKg100}
        pendingPreviousBalanceKg100={calculation.pendingPreviousBalanceKg100}
      />

      <FreezingOriginCompositionCard
        hasTraceabilityDifference={hasTraceabilityDifference}
        previousOriginUsedKg100={previousOriginUsedKg100}
        currentOriginUsedKg100={currentOriginUsedKg100}
        linkedKg100={linkedKg100}
        traceabilityDifferenceLabel={traceabilityDifferenceLabel}
        differenceKg100={differenceKg100}
        excessLinkedKg100={excessLinkedKg100}
        unsupportedFrozenKg100={unsupportedFrozenKg100}
      />

      <FreezingProductsTable
        lines={productionDay.lines}
        receivedBalanceLots={productionDay.receivedBalanceLots}
      />

      <FreezingFifoOriginTable
        freezingOriginRows={freezingOriginRows}
        hasReceivedLots={productionDay.receivedBalanceLots.length > 0}
      />
    </div>
  )
}