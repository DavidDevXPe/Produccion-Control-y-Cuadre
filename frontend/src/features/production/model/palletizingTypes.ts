import type { Kg100 } from './types'

export type PalletizingStatus = 'CUADRADO' | 'PENDIENTE' | 'DESCUADRE'
export type PalletizingStatusTone = 'success' | 'warning' | 'danger'
export type PalletizingComparisonMode = 'EXCEL' | 'SMART_CLOSEST' | 'VIDEOJET'

export interface PalletizingCalculationOptions {
  readonly comparisonMode?: PalletizingComparisonMode | undefined
}

export interface PalletizingRowInput {
  readonly productId: string
  readonly productName: string
  readonly presentationName?: string
  readonly packingKg100: Kg100
  readonly freezingKg100: Kg100
  readonly initialCameraBalanceKg100?: Kg100
  readonly videojetBagsCount?: number
  readonly videojetQrKg100: Kg100
  readonly looseBlockWithoutQrKg100?: Kg100
  readonly palletizedKg100: Kg100
  readonly palletizedBagsCount?: number
  readonly finalCameraBalanceKg100?: Kg100
}

export interface PalletizingRowCalculation {
  readonly row: PalletizingRowInput
  /** Dif. Env. vs Cong. (kg) = Envasado − Congelamiento */
  readonly diffPackingVsFreezingKg100: Kg100
  /** Dif. Cong. vs Videojet (kg) = Congelamiento − Videojet QR (o con saldos) */
  readonly diffFreezingVsVideojetKg100: Kg100
  /** Dif. por Paletizar (kg) según el modo (Envasado, Etapa más cercana o Videojet) */
  readonly diffToPalletizeKg100: Kg100
  /** Dif. Física Paletizar (kg) = (Congelamiento + Saldo Inicial) − (Paletizado + Saldo Final) */
  readonly diffPhysicalPalletizeKg100: Kg100
  /** N° Sacos armados (cada saco = 20 kg = 2 blocks de 10 kg) */
  readonly bagsCount: number
  /** Etapa utilizada como base de cuadre */
  readonly comparisonBasis?: 'PACKING' | 'FREEZING' | 'VIDEOJET'
  /** Etiqueta descriptiva de la base de comparación */
  readonly comparisonBasisLabel?: string
  readonly status: PalletizingStatus
  readonly statusTone: PalletizingStatusTone
  readonly statusReason: string
}

export interface PalletizingTotals {
  readonly totalPackingKg100: Kg100
  readonly totalFreezingKg100: Kg100
  readonly totalDiffPackingVsFreezingKg100: Kg100
  readonly totalVideojetQrKg100: Kg100
  readonly totalDiffFreezingVsVideojetKg100: Kg100
  readonly totalPalletizedKg100: Kg100
  readonly totalDiffToPalletizeKg100: Kg100
  readonly totalLooseBlockWithoutQrKg100: Kg100
  readonly totalInitialCameraBalanceKg100: Kg100
  readonly totalBagsCount: number
  readonly totalCameraBalanceKg100: Kg100
  readonly overallStatus: PalletizingStatus
  readonly overallStatusTone: PalletizingStatusTone
}
