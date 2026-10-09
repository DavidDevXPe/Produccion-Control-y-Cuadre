import type { ProductionDay, ProductionProcess } from './types'

export const DEFAULT_PRODUCTION_PROCESS: ProductionProcess = 'PACKING'

export const productionProcessLabels: Readonly<Record<ProductionProcess, string>> = {
  PACKING: 'Envasado',
  FREEZING: 'Congelamiento',
  VIDEOJET: 'Videojet',
  PALLETIZING: 'Paletizado',
}

export function isProductionProcess(value: unknown): value is ProductionProcess {
  return (
    value === 'PACKING' ||
    value === 'FREEZING' ||
    value === 'VIDEOJET' ||
    value === 'PALLETIZING'
  )
}

export function getProductionProcess(
  productionDay: Pick<ProductionDay, 'process'>,
): ProductionProcess {
  return isProductionProcess(productionDay.process)
    ? productionDay.process
    : DEFAULT_PRODUCTION_PROCESS
}

export function isPackingProductionDay(
  productionDay: Pick<ProductionDay, 'process'>,
): boolean {
  return getProductionProcess(productionDay) === 'PACKING'
}

export function isFreezingProductionDay(
  productionDay: Pick<ProductionDay, 'process'>,
): boolean {
  return getProductionProcess(productionDay) === 'FREEZING'
}

export function isVideojetProductionDay(
  productionDay: Pick<ProductionDay, 'process'>,
): boolean {
  return getProductionProcess(productionDay) === 'VIDEOJET'
}

export function isPalletizingProductionDay(
  productionDay: Pick<ProductionDay, 'process'>,
): boolean {
  return getProductionProcess(productionDay) === 'PALLETIZING'
}

export function getPreviousProcess(
  process: ProductionProcess,
): ProductionProcess | null {
  switch (process) {
    case 'PACKING':
      return null
    case 'FREEZING':
      return 'PACKING'
    case 'VIDEOJET':
      return 'FREEZING'
    case 'PALLETIZING':
      return 'VIDEOJET'
  }
}

export function hasPreviousProcess(process: ProductionProcess): boolean {
  return getPreviousProcess(process) !== null
}

export function productionDayKey(
  date: string,
  process: ProductionProcess,
): string {
  return `${date}|${process}`
}
