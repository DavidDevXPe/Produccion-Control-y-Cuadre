import {
  ANILLA_GENERAL_YIELD,
  ANILLA_POLAR_YIELD,
  ANILLA_USA_YIELD,
  MANTO_STANDARD_YIELD,
  TUBE_MP_SHARE_BPS,
  getAnillaYieldClass,
  getProcessOrigin,
  type AnillaYieldClass,
  type ProcessOrigin,
} from './businessConfig'
import { applyBasisPoints, kg100, sumKg100 } from './calculations'
import type {
  Kg100,
  ProductionDay,
  ProductionDayCalculation,
  SummaryGroupId,
} from './types'

export interface ProductionOutputPosition {
  productId: string
  productName: string
  summaryGroupId: SummaryGroupId
  finishedKg100: Kg100
  anillaYieldClass: AnillaYieldClass | null
  processOrigin: ProcessOrigin | null
}

export interface AnillaMpAllocation {
  ptPolarKg100: Kg100
  ptGeneralKg100: Kg100
  ptUsaKg100: Kg100
  ptUnclassifiedKg100: Kg100
  ptTotalKg100: Kg100
  mpPolarEstimatedKg100: Kg100
  mpGeneralEstimatedKg100: Kg100
  mpUsaEstimatedKg100: Kg100
  mpMainEstimatedKg100: Kg100
}

export interface AnillasProcessOutputs {
  mainAnillasKg100: Kg100
  botonKg100: Kg100
  recorteKg100: Kg100
  membranasKg100: Kg100
  otherCoproductsKg100: Kg100
  coproductsTotalKg100: Kg100
  processOutputsTotalKg100: Kg100
}

export interface TubeMpBalance {
  mpTotalKg100: Kg100
  mpTubeKg100: Kg100
  ptMantoKg100: Kg100
  mantoStandardYield: number
  mpMantoEstimatedKg100: Kg100
  mpAnillaProcessKg100: Kg100
  ptAnillasKg100: Kg100
  mpAnillaPolarEstimatedKg100: Kg100
  mpAnillaGeneralEstimatedKg100: Kg100
  mpAnillaUsaEstimatedKg100: Kg100
  mpMainAnillasEstimatedKg100: Kg100
  mpAnillasUnallocatedKg100: Kg100
  mpMantoExcessKg100: Kg100
  mpMainAnillasExcessKg100: Kg100
  unclassifiedAnillasKg100: Kg100
  tubeDifferenceKg100: Kg100
  processOutputs: AnillasProcessOutputs
}

export interface GroupUtilization {
  groupId: SummaryGroupId
  label: string
  finishedKg100: Kg100
  ratio: number | null
  percent: number | null
}

export interface OverallUtilization {
  finishedKg100: Kg100
  rawMaterialKg100: Kg100
  ratio: number | null
  percent: number | null
}

const GROUP_LABELS: Readonly<Record<SummaryGroupId, string>> = {
  ALETA: 'Aleta',
  MANTO: 'Manto',
  ANILLAS: 'Anillas',
  BOTON: 'Botón',
  RECORTE_CRUDO: 'Recorte crudo',
  RECORTE_COCIDO: 'Recorte cocido / Membranas',
  REJOS_SPECIAL: 'Rejos especial',
  REJOS: 'Rejo',
  REPRODUCTOR: 'Reproductor',
  PICO: 'Pico',
  NUCA_SEMILIMPIA: 'Nuca semilimpia',
  NUCA_BIKINI: 'Nuca Bikini',
}

function estimatedRawMaterial(outputKg100: Kg100, yieldRate: number): Kg100 {
  return kg100(Math.round(outputKg100 / yieldRate))
}

export function getProductionOutputPositions(
  productionDay: ProductionDay,
  calculation: ProductionDayCalculation,
): readonly ProductionOutputPosition[] {
  return productionDay.lines.map((line, index) => ({
    productId: line.productId,
    productName: line.productName,
    summaryGroupId: line.summaryGroupId,
    finishedKg100:
      calculation.products[index]?.expectedFinishedKg100 ?? kg100(0),
    anillaYieldClass: getAnillaYieldClass(line.productId, line.productName),
    processOrigin: getProcessOrigin(line.productId),
  }))
}

export function getAnillaMpAllocation(
  positions: readonly ProductionOutputPosition[],
): AnillaMpAllocation {
  const anillas = positions.filter(
    (position) => position.summaryGroupId === 'ANILLAS',
  )
  const totalFor = (yieldClass: AnillaYieldClass) =>
    sumKg100(
      anillas
        .filter((position) => position.anillaYieldClass === yieldClass)
        .map((position) => position.finishedKg100),
    )
  const ptPolarKg100 = totalFor('POLAR')
  const ptGeneralKg100 = totalFor('GENERAL')
  const ptUsaKg100 = totalFor('USA')
  const ptUnclassifiedKg100 = sumKg100(
    anillas
      .filter((position) => position.anillaYieldClass === null)
      .map((position) => position.finishedKg100),
  )
  const mpPolarEstimatedKg100 = estimatedRawMaterial(
    ptPolarKg100,
    ANILLA_POLAR_YIELD,
  )
  const mpGeneralEstimatedKg100 = estimatedRawMaterial(
    ptGeneralKg100,
    ANILLA_GENERAL_YIELD,
  )
  const mpUsaEstimatedKg100 = estimatedRawMaterial(
    ptUsaKg100,
    ANILLA_USA_YIELD,
  )
  const mpMainEstimatedKg100 = kg100(
    Math.round(
      ptPolarKg100 / ANILLA_POLAR_YIELD +
        ptGeneralKg100 / ANILLA_GENERAL_YIELD +
        ptUsaKg100 / ANILLA_USA_YIELD,
    ),
  )

  return {
    ptPolarKg100,
    ptGeneralKg100,
    ptUsaKg100,
    ptUnclassifiedKg100,
    ptTotalKg100: sumKg100(
      anillas.map((position) => position.finishedKg100),
    ),
    mpPolarEstimatedKg100,
    mpGeneralEstimatedKg100,
    mpUsaEstimatedKg100,
    mpMainEstimatedKg100,
  }
}

export function getAnillasProcessOutputs(
  positions: readonly ProductionOutputPosition[],
): AnillasProcessOutputs {
  const mainAnillasKg100 = sumKg100(
    positions
      .filter((position) => position.summaryGroupId === 'ANILLAS')
      .map((position) => position.finishedKg100),
  )
  const coproducts = positions.filter(
    (position) => position.processOrigin === 'ANILLAS',
  )
  const totalCoproductGroup = (groupId: SummaryGroupId) =>
    sumKg100(
      coproducts
        .filter((position) => position.summaryGroupId === groupId)
        .map((position) => position.finishedKg100),
    )
  const botonKg100 = totalCoproductGroup('BOTON')
  const recorteKg100 = totalCoproductGroup('RECORTE_CRUDO')
  const membranasKg100 = totalCoproductGroup('RECORTE_COCIDO')
  const coproductsTotalKg100 = sumKg100(
    coproducts.map((position) => position.finishedKg100),
  )
  const knownCoproductsKg100 = sumKg100([
    botonKg100,
    recorteKg100,
    membranasKg100,
  ])

  return {
    mainAnillasKg100,
    botonKg100,
    recorteKg100,
    membranasKg100,
    otherCoproductsKg100: kg100(
      coproductsTotalKg100 - knownCoproductsKg100,
    ),
    coproductsTotalKg100,
    processOutputsTotalKg100: sumKg100([
      mainAnillasKg100,
      coproductsTotalKg100,
    ]),
  }
}

export function getTubeMpBalance(
  productionDay: ProductionDay,
  calculation: ProductionDayCalculation,
): TubeMpBalance {
  const mpTotalKg100 = productionDay.declaredRawMaterialKg100
  const positions = getProductionOutputPositions(productionDay, calculation)
  const mpTubeKg100 = applyBasisPoints(mpTotalKg100, TUBE_MP_SHARE_BPS)
  const ptMantoKg100 = sumKg100(
    positions
      .filter((position) => position.summaryGroupId === 'MANTO')
      .map((position) => position.finishedKg100),
  )
  const mpMantoEstimatedKg100 = estimatedRawMaterial(
    ptMantoKg100,
    MANTO_STANDARD_YIELD,
  )
  const mpAnillaProcessKg100 = kg100(
    mpTubeKg100 - mpMantoEstimatedKg100,
  )
  const anillas = getAnillaMpAllocation(positions)
  const processOutputs = getAnillasProcessOutputs(positions)

  return {
    mpTotalKg100,
    mpTubeKg100,
    ptMantoKg100,
    mantoStandardYield: MANTO_STANDARD_YIELD,
    mpMantoEstimatedKg100,
    mpAnillaProcessKg100,
    ptAnillasKg100: anillas.ptTotalKg100,
    mpAnillaPolarEstimatedKg100: anillas.mpPolarEstimatedKg100,
    mpAnillaGeneralEstimatedKg100: anillas.mpGeneralEstimatedKg100,
    mpAnillaUsaEstimatedKg100: anillas.mpUsaEstimatedKg100,
    mpMainAnillasEstimatedKg100: anillas.mpMainEstimatedKg100,
    mpAnillasUnallocatedKg100: kg100(
      Math.max(
        mpAnillaProcessKg100 - anillas.mpMainEstimatedKg100,
        0,
      ),
    ),
    mpMantoExcessKg100: kg100(
      Math.max(mpMantoEstimatedKg100 - mpTubeKg100, 0),
    ),
    mpMainAnillasExcessKg100: kg100(
      Math.max(anillas.mpMainEstimatedKg100 - mpAnillaProcessKg100, 0),
    ),
    unclassifiedAnillasKg100: anillas.ptUnclassifiedKg100,
    tubeDifferenceKg100: kg100(
      mpTubeKg100 - (mpMantoEstimatedKg100 + mpAnillaProcessKg100),
    ),
    processOutputs,
  }
}

export function getGroupUtilization(
  positions: readonly ProductionOutputPosition[],
  rawMaterialKg100: Kg100,
): readonly GroupUtilization[] {
  const totals = new Map<SummaryGroupId, Kg100>()

  for (const position of positions) {
    totals.set(
      position.summaryGroupId,
      kg100(
        (totals.get(position.summaryGroupId) ?? kg100(0)) +
          position.finishedKg100,
      ),
    )
  }

  return [...totals.entries()].map(([groupId, finishedKg100]) => {
    const ratio =
      rawMaterialKg100 === 0 ? null : finishedKg100 / rawMaterialKg100
    return {
      groupId,
      label: GROUP_LABELS[groupId],
      finishedKg100,
      ratio,
      percent: ratio === null ? null : ratio * 100,
    }
  })
}

export function getOverallUtilization(
  finishedKg100: Kg100,
  rawMaterialKg100: Kg100,
): OverallUtilization {
  const ratio =
    rawMaterialKg100 === 0 ? null : finishedKg100 / rawMaterialKg100
  return {
    finishedKg100,
    rawMaterialKg100,
    ratio,
    percent: ratio === null ? null : ratio * 100,
  }
}
