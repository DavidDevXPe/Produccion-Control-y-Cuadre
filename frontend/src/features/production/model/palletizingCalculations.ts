import { formatCentiKgValue } from '../../../utils/formatters'
import { kg100, sumKg100 } from './calculations'
import type { Kg100 } from './types'
import type {
  PalletizingCalculationOptions,
  PalletizingRowCalculation,
  PalletizingRowInput,
  PalletizingTotals,
} from './palletizingTypes'

export function calculatePalletizingRow(
  input: PalletizingRowInput,
  options?: PalletizingCalculationOptions,
): PalletizingRowCalculation {
  const comparisonMode =
    (typeof options === 'object' && options !== null ? options.comparisonMode : undefined) ??
    'EXCEL'
  const diffPackingVsFreezingKg100 = kg100(
    input.packingKg100 - input.freezingKg100,
  )

  const initialBalance = input.initialCameraBalanceKg100 ?? kg100(0)
  const finalBalance = input.finalCameraBalanceKg100 ?? kg100(0)
  const looseBlock = input.looseBlockWithoutQrKg100 ?? kg100(0)

  // Dif. Videojet: Si hay saldos de cámara especificados, considera saldo inicial y block suelto
  const isDetailedAudit =
    input.initialCameraBalanceKg100 !== undefined ||
    input.finalCameraBalanceKg100 !== undefined

  const diffFreezingVsVideojetKg100 = isDetailedAudit
    ? kg100(input.freezingKg100 + initialBalance - input.videojetQrKg100 - looseBlock)
    : kg100(input.freezingKg100 - input.videojetQrKg100)

  // Dif. por Paletizar (kg) según el modo de comparación elegido
  const netPackingDiff = input.packingKg100 + initialBalance - input.palletizedKg100
  const netFreezingDiff = input.freezingKg100 + initialBalance - input.palletizedKg100
  const netVideojetDiff = input.videojetQrKg100 + initialBalance - input.palletizedKg100

  // Dif. Física Paletizar (kg) = (Congelamiento + Saldo Inicial) − (Paletizado + Saldo Final)
  const diffPhysicalPalletizeKg100 = kg100(
    input.freezingKg100 + initialBalance - (input.palletizedKg100 + finalBalance),
  )

  let diffToPalletizeKg100: Kg100
  let comparisonBasis: 'PACKING' | 'FREEZING' | 'VIDEOJET'
  let comparisonBasisLabel: string

  if (comparisonMode === 'VIDEOJET') {
    diffToPalletizeKg100 = kg100(netVideojetDiff)
    comparisonBasis = 'VIDEOJET'
    comparisonBasisLabel = 'Videojet QR'
  } else if (comparisonMode === 'SMART_CLOSEST') {
    if (netFreezingDiff === 0 && input.freezingKg100 > 0) {
      diffToPalletizeKg100 = kg100(0)
      comparisonBasis = 'FREEZING'
      comparisonBasisLabel = 'Congelamiento'
    } else if (netPackingDiff === 0 && input.packingKg100 > 0) {
      diffToPalletizeKg100 = kg100(0)
      comparisonBasis = 'PACKING'
      comparisonBasisLabel = 'Envasado'
    } else if (netVideojetDiff === 0 && input.videojetQrKg100 > 0) {
      diffToPalletizeKg100 = kg100(0)
      comparisonBasis = 'VIDEOJET'
      comparisonBasisLabel = 'Videojet QR'
    } else {
      const absFreezing = Math.abs(netFreezingDiff)
      const absPacking = Math.abs(netPackingDiff)
      const absVideojet = Math.abs(netVideojetDiff)
      const minAbs = Math.min(absFreezing, absPacking, absVideojet)

      if (minAbs === absFreezing && input.freezingKg100 > 0) {
        diffToPalletizeKg100 = kg100(netFreezingDiff)
        comparisonBasis = 'FREEZING'
        comparisonBasisLabel = 'Congelamiento'
      } else if (minAbs === absPacking && input.packingKg100 > 0) {
        diffToPalletizeKg100 = kg100(netPackingDiff)
        comparisonBasis = 'PACKING'
        comparisonBasisLabel = 'Envasado'
      } else {
        diffToPalletizeKg100 = kg100(netVideojetDiff)
        comparisonBasis = 'VIDEOJET'
        comparisonBasisLabel = 'Videojet QR'
      }
    }
  } else {
    // 'EXCEL' (por defecto: Envasado + Saldo Inicial - Paletizado)
    diffToPalletizeKg100 = kg100(netPackingDiff)
    comparisonBasis = 'PACKING'
    comparisonBasisLabel = 'Envasado'
  }

  // Cada saco armado = 20 kg = 2 blocks de 10 kg
  const bagsCount =
    input.palletizedBagsCount !== undefined
      ? input.palletizedBagsCount
      : Math.round((input.palletizedKg100 / 100 / 20) * 10) / 10

  let status: 'CUADRADO' | 'PENDIENTE' | 'DESCUADRE'
  let statusTone: 'success' | 'warning' | 'danger'
  let statusReason: string

  if (isDetailedAudit) {
    if (diffPackingVsFreezingKg100 !== 0) {
      status = 'DESCUADRE'
      statusTone = 'danger'
      statusReason =
        diffPackingVsFreezingKg100 > 0
          ? 'Envasado mayor que congelamiento (merma o pendiente en túnel)'
          : 'Congelamiento supera a lo envasado'
    } else if (diffFreezingVsVideojetKg100 !== 0) {
      status = 'DESCUADRE'
      statusTone = 'danger'
      statusReason = 'Desfase en rotulado QR Videojet'
    } else if (diffPhysicalPalletizeKg100 !== 0) {
      status = 'DESCUADRE'
      statusTone = 'danger'
      statusReason = 'Diferencia física no justificada en cámara'
    } else {
      status = 'CUADRADO'
      statusTone = 'success'
      statusReason = 'Conciliación física exacta con saldo de cámara'
    }
  } else {
    // Control rápido (Tabla 1 de Excel)
    if (diffToPalletizeKg100 < 0) {
      status = 'DESCUADRE'
      statusTone = 'danger'
      statusReason = `Sobregiro en paletizado (se paletizó más de lo registrado en ${comparisonBasisLabel})`
    } else if (diffPackingVsFreezingKg100 !== 0 && comparisonMode !== 'SMART_CLOSEST') {
      status = 'DESCUADRE'
      statusTone = 'danger'
      statusReason =
        diffPackingVsFreezingKg100 > 0
          ? 'Faltante de congelamiento en túneles'
          : 'Congelado mayor que envasado'
    } else if (diffToPalletizeKg100 > 0) {
      status = 'PENDIENTE'
      statusTone = 'warning'
      statusReason = 'Saldo normal en cámara a la espera de completar pallet'
    } else {
      status = 'CUADRADO'
      statusTone = 'success'
      statusReason =
        comparisonBasis === 'FREEZING' && diffPackingVsFreezingKg100 !== 0
          ? `Cuadrado con Congelamiento (merma en túnel: ${formatCentiKgValue(diffPackingVsFreezingKg100)} kg)`
          : comparisonBasis === 'PACKING' && diffFreezingVsVideojetKg100 !== 0
            ? 'Cuadrado con Envasado (omisión en rotulado Videojet QR)'
            : 'Proceso 100% conciliado (diferencias = 0 kg)'
    }
  }

  return {
    row: input,
    diffPackingVsFreezingKg100,
    diffFreezingVsVideojetKg100,
    diffToPalletizeKg100,
    diffPhysicalPalletizeKg100,
    bagsCount,
    comparisonBasis,
    comparisonBasisLabel,
    status,
    statusTone,
    statusReason,
  }
}

export function calculatePalletizingTotals(
  rows: readonly PalletizingRowCalculation[],
): PalletizingTotals {
  const totalPackingKg100 = sumKg100(rows.map((r) => r.row.packingKg100))
  const totalFreezingKg100 = sumKg100(rows.map((r) => r.row.freezingKg100))
  const totalDiffPackingVsFreezingKg100 = kg100(
    totalPackingKg100 - totalFreezingKg100,
  )
  const totalVideojetQrKg100 = sumKg100(rows.map((r) => r.row.videojetQrKg100))
  const totalDiffFreezingVsVideojetKg100 = sumKg100(
    rows.map((r) => r.diffFreezingVsVideojetKg100),
  )
  const totalPalletizedKg100 = sumKg100(rows.map((r) => r.row.palletizedKg100))
  const totalDiffToPalletizeKg100 = sumKg100(
    rows.map((r) => r.diffToPalletizeKg100),
  )
  const totalLooseBlockWithoutQrKg100 = sumKg100(
    rows.map((r) => r.row.looseBlockWithoutQrKg100 ?? kg100(0)),
  )
  const totalInitialCameraBalanceKg100 = sumKg100(
    rows.map((r) => r.row.initialCameraBalanceKg100 ?? kg100(0)),
  )
  const totalBagsCount = rows.reduce((sum, r) => sum + r.bagsCount, 0)
  const totalCameraBalanceKg100 = sumKg100(
    rows.map((r) => r.row.finalCameraBalanceKg100 ?? kg100(0)),
  )

  const hasDescuadre = rows.some((r) => r.status === 'DESCUADRE')
  const hasPendiente = rows.some((r) => r.status === 'PENDIENTE')

  const overallStatus = hasDescuadre
    ? 'DESCUADRE'
    : hasPendiente
      ? 'PENDIENTE'
      : 'CUADRADO'

  const overallStatusTone = hasDescuadre
    ? 'danger'
    : hasPendiente
      ? 'warning'
      : 'success'

  return {
    totalPackingKg100,
    totalFreezingKg100,
    totalDiffPackingVsFreezingKg100,
    totalVideojetQrKg100,
    totalDiffFreezingVsVideojetKg100,
    totalPalletizedKg100,
    totalDiffToPalletizeKg100,
    totalLooseBlockWithoutQrKg100,
    totalInitialCameraBalanceKg100,
    totalBagsCount,
    totalCameraBalanceKg100,
    overallStatus,
    overallStatusTone,
  }
}
