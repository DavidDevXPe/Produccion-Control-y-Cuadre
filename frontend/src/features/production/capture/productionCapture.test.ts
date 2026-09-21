import { describe, expect, it } from 'vitest'
import { kg100 } from '../model/calculations'
import {
  getProductionMovements,
  getProductTotal,
  getTunnelTotals,
} from '../model/movements'
import {
  buildProductionDayFromCapture,
  createEmptyCaptureDraft,
  type ProductionCaptureBalanceUse,
  type ProductionCaptureRow,
} from './productionCapture'
import { PRODUCTION_CATALOG_ITEMS } from './productionCatalog'

function row(overrides: Partial<ProductionCaptureRow> = {}): ProductionCaptureRow {
  return {
    key: 'row-1',
    product: PRODUCTION_CATALOG_ITEMS.find(
      (product) => product.productId === 'aleta-cruda-codificada',
    )!,
    dayReportedKg: '50',
    dayPreviousBalanceKg: '0',
    nightReportedKg: '30',
    nightPreviousBalanceKg: '0',
    tunnelDayKg: '0',
    tunnelNightKg: '0',
    treatmentKg: '0',
    closingBalanceKg: '20',
    finishedKg: '100',
    ...overrides,
  }
}

describe('production capture', () => {
  it('calculates the Wednesday Tunnel scenario without counting Tunnel twice', () => {
    const product = (productId: string) =>
      PRODUCTION_CATALOG_ITEMS.find((candidate) => candidate.productId === productId)!
    const reportProduct = product('recorte-crudo-manto-japones')
    const originDraft = {
      ...createEmptyCaptureDraft('2026-09-06'),
      operationMode: 'NORMAL' as const,
      rawMaterialKg: '100000',
      declaredDayTotalKg: '0',
      declaredNightTotalKg: '0',
      rows: [
        row({
          key: 'origin-balance',
          product: reportProduct,
          dayReportedKg: '0',
          nightReportedKg: '0',
          closingBalanceKg: '65000',
        }),
      ],
    }
    const origin = buildProductionDayFromCapture(originDraft, [], []).productionDay
    const currentDraft = {
      ...createEmptyCaptureDraft('2026-09-09'),
      hasTunnelProduction: true,
      rawMaterialKg: '700000',
      declaredDayTotalKg: '270940',
      declaredNightTotalKg: '226540',
      rows: [
        row({
          key: 'normal-report',
          product: reportProduct,
          dayReportedKg: '270940',
          nightReportedKg: '226540',
          treatmentKg: '9140',
          closingBalanceKg: '71550',
        }),
        row({
          key: 'tunnel-manto-standard',
          product: product('manto-estandar-crudo-2-4'),
          dayReportedKg: '0',
          nightReportedKg: '0',
          tunnelDayKg: '21500',
          tunnelNightKg: '12060',
          closingBalanceKg: '0',
        }),
        row({
          key: 'tunnel-manto-japanese',
          product: product('manto-japones-crudo'),
          dayReportedKg: '0',
          nightReportedKg: '0',
          tunnelDayKg: '6580',
          tunnelNightKg: '14040',
          closingBalanceKg: '0',
        }),
        row({
          key: 'tunnel-nuca',
          product: product('nuca-semilimpia-codificada'),
          dayReportedKg: '0',
          nightReportedKg: '0',
          tunnelDayKg: '4320',
          tunnelNightKg: '0',
          closingBalanceKg: '0',
        }),
      ],
      balanceUses: [
        {
          key: 'previous-balance',
          originDayId: origin.id,
          originDate: origin.date,
          familyId: reportProduct.familyId,
          familyName: reportProduct.familyName,
          productId: reportProduct.productId,
          productName: reportProduct.productName,
          availableKg100: kg100(6_500_000),
          dayKg: '65000',
          nightKg: '0',
        },
      ],
    }
    const result = buildProductionDayFromCapture(currentDraft, [origin], [])
    const movements = getProductionMovements(result.productionDay, result.calculation)

    expect(result.inputErrors).toEqual([])
    expect(result.calculation.tunnel).toEqual({
      dayKg100: kg100(3_240_000),
      nightKg100: kg100(2_610_000),
      totalKg100: kg100(5_850_000),
    })
    expect(result.calculation.productiveDayKg100).toBe(kg100(23_834_000))
    expect(result.calculation.productiveNightKg100).toBe(kg100(25_264_000))
    expect(result.calculation.expectedFinishedKg100).toBe(kg100(57_167_000))
    expect(getTunnelTotals(movements).totalKg100).toBe(kg100(5_850_000))
    expect(getProductTotal(movements, 'manto-estandar-crudo-2-4')).toBe(
      kg100(3_356_000),
    )
    expect(getProductTotal(movements, 'manto-japones-crudo')).toBe(
      kg100(2_062_000),
    )
    expect(getProductTotal(movements, 'nuca-semilimpia-codificada')).toBe(
      kg100(432_000),
    )
  })

  it('keeps the same product traceable in Report and Tunnel as distinct movements', () => {
    const draft = {
      ...createEmptyCaptureDraft('2026-09-10'),
      hasTunnelProduction: true,
      rawMaterialKg: '125',
      declaredDayTotalKg: '50',
      declaredNightTotalKg: '30',
      rows: [row({ tunnelDayKg: '5', tunnelNightKg: '7' })],
    }
    const result = buildProductionDayFromCapture(draft, [], [])
    const movements = getProductionMovements(result.productionDay, result.calculation)
      .filter((movement) => movement.productId === row().product.productId)

    expect(movements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ movementType: 'REPORT_DAY', kg100: kg100(5_000) }),
        expect.objectContaining({ movementType: 'REPORT_NIGHT', kg100: kg100(3_000) }),
        expect.objectContaining({ movementType: 'TUNNEL_DAY', kg100: kg100(500) }),
        expect.objectContaining({ movementType: 'TUNNEL_NIGHT', kg100: kg100(700) }),
      ]),
    )
    expect(new Set(movements.map((movement) => movement.id)).size).toBe(movements.length)
  })

  it('treats Tunnel as zero when its optional condition is disabled', () => {
    const draft = {
      ...createEmptyCaptureDraft('2026-09-10'),
      rawMaterialKg: '125',
      declaredDayTotalKg: '50',
      declaredNightTotalKg: '30',
      rows: [row({ tunnelDayKg: '5', tunnelNightKg: '7' })],
    }
    const result = buildProductionDayFromCapture(draft, [], [])
    const movements = getProductionMovements(
      result.productionDay,
      result.calculation,
    )

    expect(result.productionDay.hasTunnelProduction).toBe(false)
    expect(result.calculation.tunnel).toEqual({
      dayKg100: kg100(0),
      nightKg100: kg100(0),
      totalKg100: kg100(0),
    })
    expect(result.calculation.expectedFinishedKg100).toBe(kg100(10_000))
    expect(getTunnelTotals(movements).totalKg100).toBe(kg100(0))
  })

  it('identifies an invalid Tunnel value with its stage and shift', () => {
    const draft = {
      ...createEmptyCaptureDraft('2026-09-10'),
      hasTunnelProduction: true,
      rawMaterialKg: '100',
      declaredDayTotalKg: '50',
      declaredNightTotalKg: '30',
      rows: [row({ tunnelDayKg: '-1' })],
    }
    const result = buildProductionDayFromCapture(draft, [], [])

    expect(result.inputErrors).toContain(
      `${row().product.productName}: Túnel Día debe ser una cantidad válida mayor o igual a cero.`,
    )
  })

  it('calculates finished product for a manual day instead of trusting editable values', () => {
    const draft = {
      ...createEmptyCaptureDraft('2026-09-07'),
      rawMaterialKg: '125',
      declaredDayTotalKg: '50',
      declaredNightTotalKg: '30',
      declaredFinishedTotalKg: '999',
      rows: [row({ finishedKg: '999' })],
    }
    const result = buildProductionDayFromCapture(draft, [], [], 'CLOSED')

    expect(result.inputErrors).toEqual([])
    expect(result.productionDay.status).toBe('CLOSED')
    expect(result.productionDay.declaredFinishedTotalKg100).toBe(kg100(10_000))
    expect(result.productionDay.lines[0]?.declaredFinishedKg100).toBe(kg100(10_000))
    expect(result.calculation.status).toBe('BALANCED')
    expect(result.calculation.differenceKg100).toBe(kg100(0))
    expect(result.calculation.newClosingBalanceKg100).toBe(kg100(2_000))
  })

  it('derives finished product from Day and Night reports for Excel-imported Packing', () => {
    const draft = {
      ...createEmptyCaptureDraft('2026-09-18'),
      source: 'EXCEL' as const,
      sourceSheet: 'Reporte',
      rawMaterialKg: '383670',
      declaredDayTotalKg: '227640',
      declaredNightTotalKg: '156030',
      declaredFinishedTotalKg: '0',
      rows: [
        row({
          dayReportedKg: '227640',
          nightReportedKg: '156030',
          closingBalanceKg: '0',
          finishedKg: '0',
        }),
      ],
    }

    const result = buildProductionDayFromCapture(draft, [], [], 'CLOSED')

    expect(result.inputErrors).toEqual([])
    expect(result.productionDay.declaredFinishedTotalKg100).toBe(
      kg100(38_367_000),
    )
    expect(result.productionDay.lines[0]?.declaredFinishedKg100).toBe(
      kg100(38_367_000),
    )
    expect(result.calculation.differenceKg100).toBe(kg100(0))
  })

  it('splits a traceable 10,820 kg balance between Day and Night', () => {
    const originDraft = {
      ...createEmptyCaptureDraft('2026-09-06'),
      operationMode: 'NORMAL' as const,
      rawMaterialKg: '20000',
      declaredDayTotalKg: '0',
      declaredNightTotalKg: '0',
      rows: [
        row({
          dayReportedKg: '0',
          nightReportedKg: '0',
          closingBalanceKg: '10820',
        }),
      ],
    }
    const origin = buildProductionDayFromCapture(originDraft, [], []).productionDay
    const balanceUse: ProductionCaptureBalanceUse = {
      key: 'previous-aleta',
      originDayId: origin.id,
      originDate: origin.date,
      familyId: row().product.familyId,
      familyName: row().product.familyName,
      productId: row().product.productId,
      productName: row().product.productName,
      availableKg100: kg100(1_082_000),
      dayKg: '7000',
      nightKg: '3820',
    }
    const draft = {
      ...createEmptyCaptureDraft('2026-09-07'),
      rawMaterialKg: '12500',
      declaredDayTotalKg: '7000',
      declaredNightTotalKg: '3820',
      rows: [
        row({
          dayReportedKg: '7000',
          nightReportedKg: '3820',
          closingBalanceKg: '0',
        }),
      ],
      balanceUses: [balanceUse],
    }
    const result = buildProductionDayFromCapture(draft, [origin], [])

    expect(result.inputErrors).toEqual([])
    expect(result.calculation.processedPreviousBalanceKg100).toBe(kg100(1_082_000))
    expect(result.calculation.pendingPreviousBalanceKg100).toBe(kg100(0))
    expect(result.calculation.status).toBe('BALANCED')
  })

  it('flags use above the amount available from a traceable balance', () => {
    const originDraft = {
      ...createEmptyCaptureDraft('2026-09-06'),
      operationMode: 'NORMAL' as const,
      rawMaterialKg: '20000',
      declaredDayTotalKg: '0',
      declaredNightTotalKg: '0',
      rows: [
        row({
          dayReportedKg: '0',
          nightReportedKg: '0',
          closingBalanceKg: '10',
        }),
      ],
    }
    const origin = buildProductionDayFromCapture(originDraft, [], []).productionDay
    const product = row().product
    const draft = {
      ...createEmptyCaptureDraft('2026-09-07'),
      rawMaterialKg: '125',
      declaredDayTotalKg: '11',
      declaredNightTotalKg: '0',
      rows: [row({ dayReportedKg: '11', nightReportedKg: '0', closingBalanceKg: '0' })],
      balanceUses: [
        {
          key: 'previous-aleta',
          originDayId: origin.id,
          originDate: origin.date,
          familyId: product.familyId,
          familyName: product.familyName,
          productId: product.productId,
          productName: product.productName,
          availableKg100: kg100(1_000),
          dayKg: '11',
          nightKg: '0',
        },
      ],
    }
    const result = buildProductionDayFromCapture(draft, [origin], [])

    expect(
      result.calculation.integrityIssues.map((issue) => issue.code),
    ).toContain('BALANCE_OVERUSED')
    expect(result.calculation.status).toBe('UNBALANCED')
  })

  it('rejects a selected previous balance when its origin is unavailable', () => {
    const product = row().product
    const draft = {
      ...createEmptyCaptureDraft('2026-09-07'),
      balanceUses: [
        {
          key: 'missing-balance',
          originDayId: 'production-day-2026-09-05',
          originDate: '2026-09-05',
          familyId: product.familyId,
          familyName: product.familyName,
          productId: product.productId,
          productName: product.productName,
          availableKg100: kg100(1_000),
          dayKg: '1',
          nightKg: '0',
        },
      ],
    }

    const result = buildProductionDayFromCapture(draft, [], [])

    expect(result.inputErrors).toContain(
      `El saldo de ${product.productName} ya no está disponible o no tiene un origen válido.`,
    )
  })

  it('requires an exact product before closing a legacy family-only balance', () => {
    const knownProduct = row().product
    const originDraft = {
      ...createEmptyCaptureDraft('2026-09-06'),
      operationMode: 'NORMAL' as const,
      rawMaterialKg: '100',
      declaredDayTotalKg: '0',
      declaredNightTotalKg: '0',
      rows: [
        row({
          dayReportedKg: '0',
          nightReportedKg: '0',
          closingBalanceKg: '10',
        }),
      ],
    }
    const builtOrigin = buildProductionDayFromCapture(originDraft, [], [])
      .productionDay
    const legacyProductId = 'legacy-family-only-aleta'
    const origin = {
      ...builtOrigin,
      lines: builtOrigin.lines.map((line) => ({
        ...line,
        productId: legacyProductId,
        productName: 'Producto exacto no identificado',
      })),
    }
    const draft = {
      ...createEmptyCaptureDraft('2026-09-07'),
      rawMaterialKg: '100',
      declaredDayTotalKg: '10',
      declaredNightTotalKg: '0',
      rows: [row({ dayReportedKg: '10', nightReportedKg: '0', closingBalanceKg: '0' })],
      balanceUses: [
        {
          key: 'legacy-balance',
          originDayId: origin.id,
          originDate: origin.date,
          familyId: knownProduct.familyId,
          familyName: knownProduct.familyName,
          productId: knownProduct.productId,
          productName: knownProduct.productName,
          sourceProductId: legacyProductId,
          requiresProductDistribution: true,
          availableKg100: kg100(1_000),
          dayKg: '10',
          nightKg: '0',
        },
      ],
    }

    const unresolved = buildProductionDayFromCapture(draft, [origin], [])
    expect(unresolved.inputErrors).toContain(
      `El saldo de ${knownProduct.familyName} requiere distribución. Selecciona el producto exacto antes de cerrar.`,
    )

    const resolved = buildProductionDayFromCapture(
      {
        ...draft,
        balanceUses: draft.balanceUses.map((balance) => ({
          ...balance,
          requiresProductDistribution: false,
        })),
      },
      [origin],
      [],
    )
    expect(resolved.inputErrors).toEqual([])
    expect(resolved.productionDay.receivedBalanceLots[0]).toMatchObject({
      originDayId: origin.id,
      productId: knownProduct.productId,
      sourceProductId: legacyProductId,
    })
  })

  it('allows an incomplete but syntactically valid draft to be built', () => {
    const result = buildProductionDayFromCapture(
      createEmptyCaptureDraft('2026-09-07'),
      [],
      [],
    )

    expect(result.inputErrors).toEqual([])
    expect(result.productionDay.status).toBe('DRAFT')
  })

  it('reconciles product shifts for an imported sheet while retaining allocation certainty', () => {
    const draft = {
      ...createEmptyCaptureDraft('2026-09-08'),
      source: 'EXCEL' as const,
      sourceSheet: 'MARTES',
      shiftAllocationMode: 'RECONCILED_INFERENCE' as const,
      rawMaterialKg: '125',
      declaredDayTotalKg: '50',
      declaredNightTotalKg: '30',
      declaredFinishedTotalKg: '100',
      rows: [row({ dayReportedKg: '', nightReportedKg: '' })],
    }
    const result = buildProductionDayFromCapture(draft, [], [])

    expect(result.calculation.status).toBe('BALANCED')
    expect(result.productionDay.lines[0]?.shiftBreakdownConfidence).toBe(
      'RECONCILED_INFERENCE',
    )
    expect(result.calculation.day.declaredReportedKg100).toBe(kg100(5_000))
    expect(result.calculation.night.declaredReportedKg100).toBe(kg100(3_000))
  })
})
