import { describe, expect, it } from 'vitest'
import { kg100 } from './calculations'
import type { ProductionDay } from './types'
import { renderHook } from '@testing-library/react'
import { useFreezingTraceability } from '../hooks/useFreezingTraceability'
import { createEmptyCaptureDraft } from '../capture/productionCapture'
import { buildFreezingFifoAllocation } from '../capture/freezingFifo'
import { getAnillaYieldClass } from './businessConfig'
import {
  buildUpdatedFreezingDraft,
  parseIsoDateFromSheetName,
} from '../hooks/excelImportFreezingHelpers'
import { freezingTraceabilityStatus } from '../pages/captureProductStatus'

describe('User Scenario: 07-10-2026 Production & Freezing Traceability', () => {
  it('correctly classifies ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P SM CP ST MIXTA 100% P.N. as GENERAL', () => {
    expect(getAnillaYieldClass('anillas-espana-p-sm-cp-st-mixta')).toBe('GENERAL')
    expect(
      getAnillaYieldClass(
        'custom-id-123',
        'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P SM CP ST MIXTA 100% P.N.',
      ),
    ).toBe('GENERAL')
    expect(
      getAnillaYieldClass(
        'custom-polar',
        'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P POLAR SM SP ST MIXTA 100% P.N.',
      ),
    ).toBe('POLAR')
  })

  it('parses date from Excel sheet names like 07-10-2026', () => {
    expect(parseIsoDateFromSheetName('07-10-2026')).toBe('2026-10-07')
    expect(parseIsoDateFromSheetName('05/10/2026')).toBe('2026-10-05')
    expect(parseIsoDateFromSheetName('2026-10-07')).toBe('2026-10-07')
    expect(parseIsoDateFromSheetName('CONGELAMIENTO DÍA')).toBeNull()
  })

  it('evaluates Wednesday 07-10-2026 Freezing correctly against 07-10 Envasado, without confusing with Monday 05-10 residual', () => {
    // 05-10-2026: Manto Envasado 2470, Congelado 1900 -> 570 pending
    const day05Packing: ProductionDay = {
      id: 'production-day-2026-10-05',
      date: '2026-10-05',
      displayName: 'Lunes 05/10/2026',
      status: 'CLOSED',
      captureRequiredDataComplete: true,
      process: 'PACKING',
      operationMode: 'NORMAL',
      rawMaterialEntries: [],
      declaredRawMaterialKg100: kg100(15460),
      declaredShiftTotalsKg100: { DAY: kg100(15460), NIGHT: kg100(0) },
      declaredFinishedTotalKg100: kg100(15460),
      hasTunnelProduction: false,
      lines: [
        {
          familyId: 'manto-crudo',
          familyName: 'MANTO CRUDO',
          productId: 'manto-japones-crudo',
          productName:
            'MANTO JAPONES CRUDO CONGELADO BLOCK S/TTO 2 KG - 4 KG SB 100% P.N.',
          summaryGroupId: 'MANTO',
          source: { sheet: '05-10-2026', cell: 'B1' },
          shiftBreakdownConfidence: 'EXPLICIT',
          shifts: {
            DAY: { reportedKg100: kg100(2470), adjustments: [] },
            NIGHT: { reportedKg100: kg100(0), adjustments: [] },
          },
          treatmentKg100: kg100(0),
          newClosingBalanceKg100: kg100(0),
          declaredFinishedKg100: kg100(2470),
        },
      ],
      receivedBalanceLots: [],
      nucaWashAuthorization: null,
      performanceReferenceBasisPoints: 8000,
      nucaBikiniReferenceBasisPoints: 700,
      rawMaterialAllocationOverridesKg100: {},
    }

    const day05Freezing: ProductionDay = {
      id: 'production-day-freezing-2026-10-05',
      date: '2026-10-05',
      displayName: 'Lunes 05/10/2026',
      status: 'CLOSED',
      captureRequiredDataComplete: true,
      process: 'FREEZING',
      operationMode: 'NORMAL',
      rawMaterialEntries: [],
      declaredRawMaterialKg100: kg100(0),
      declaredShiftTotalsKg100: { DAY: kg100(1900), NIGHT: kg100(0) },
      declaredFinishedTotalKg100: kg100(1900),
      hasTunnelProduction: false,
      lines: [
        {
          familyId: 'manto-crudo',
          familyName: 'MANTO CRUDO',
          productId: 'manto-japones-crudo',
          productName:
            'MANTO JAPONES CRUDO CONGELADO BLOCK S/TTO 2 KG - 4 KG SB 100% P.N.',
          summaryGroupId: 'MANTO',
          source: { sheet: '05-10-2026', cell: 'B1' },
          shiftBreakdownConfidence: 'EXPLICIT',
          shifts: {
            DAY: { reportedKg100: kg100(1900), adjustments: [] },
            NIGHT: { reportedKg100: kg100(0), adjustments: [] },
          },
          treatmentKg100: kg100(0),
          newClosingBalanceKg100: kg100(0),
          declaredFinishedKg100: kg100(1900),
        },
      ],
      receivedBalanceLots: [
        {
          id: 'bal-05',
          originDayId: 'production-day-2026-10-05',
          familyId: 'manto-crudo',
          productId: 'manto-japones-crudo',
          sourceProductId: 'manto-japones-crudo',
          originalKg100: kg100(2470),
          uses: [
            {
              id: 'use-05',
              targetDayId: 'production-day-freezing-2026-10-05',
              shift: 'DAY',
              kg100: kg100(1900),
            },
          ],
        },
      ],
      nucaWashAuthorization: null,
      performanceReferenceBasisPoints: 8000,
      nucaBikiniReferenceBasisPoints: 700,
      rawMaterialAllocationOverridesKg100: {},
    }

    // 06-10-2026: Manto Envasado 1250, Congelado 1250
    const day06Packing: ProductionDay = {
      id: 'production-day-2026-10-06',
      date: '2026-10-06',
      displayName: 'Martes 06/10/2026',
      status: 'CLOSED',
      captureRequiredDataComplete: true,
      process: 'PACKING',
      operationMode: 'NORMAL',
      rawMaterialEntries: [],
      declaredRawMaterialKg100: kg100(4970),
      declaredShiftTotalsKg100: { DAY: kg100(4970), NIGHT: kg100(0) },
      declaredFinishedTotalKg100: kg100(4970),
      hasTunnelProduction: false,
      lines: [
        {
          familyId: 'manto-crudo',
          familyName: 'MANTO CRUDO',
          productId: 'manto-japones-crudo',
          productName:
            'MANTO JAPONES CRUDO CONGELADO BLOCK S/TTO 2 KG - 4 KG SB 100% P.N.',
          summaryGroupId: 'MANTO',
          source: { sheet: '06-10-2026', cell: 'B1' },
          shiftBreakdownConfidence: 'EXPLICIT',
          shifts: {
            DAY: { reportedKg100: kg100(1250), adjustments: [] },
            NIGHT: { reportedKg100: kg100(0), adjustments: [] },
          },
          treatmentKg100: kg100(0),
          newClosingBalanceKg100: kg100(0),
          declaredFinishedKg100: kg100(1250),
        },
      ],
      receivedBalanceLots: [],
      nucaWashAuthorization: null,
      performanceReferenceBasisPoints: 8000,
      nucaBikiniReferenceBasisPoints: 700,
      rawMaterialAllocationOverridesKg100: {},
    }

    const day06Freezing: ProductionDay = {
      id: 'production-day-freezing-2026-10-06',
      date: '2026-10-06',
      displayName: 'Martes 06/10/2026',
      status: 'CLOSED',
      captureRequiredDataComplete: true,
      process: 'FREEZING',
      operationMode: 'NORMAL',
      rawMaterialEntries: [],
      declaredRawMaterialKg100: kg100(0),
      declaredShiftTotalsKg100: { DAY: kg100(1250), NIGHT: kg100(0) },
      declaredFinishedTotalKg100: kg100(1250),
      hasTunnelProduction: false,
      lines: [
        {
          familyId: 'manto-crudo',
          familyName: 'MANTO CRUDO',
          productId: 'manto-japones-crudo',
          productName:
            'MANTO JAPONES CRUDO CONGELADO BLOCK S/TTO 2 KG - 4 KG SB 100% P.N.',
          summaryGroupId: 'MANTO',
          source: { sheet: '06-10-2026', cell: 'B1' },
          shiftBreakdownConfidence: 'EXPLICIT',
          shifts: {
            DAY: { reportedKg100: kg100(1250), adjustments: [] },
            NIGHT: { reportedKg100: kg100(0), adjustments: [] },
          },
          treatmentKg100: kg100(0),
          newClosingBalanceKg100: kg100(0),
          declaredFinishedKg100: kg100(1250),
        },
      ],
      receivedBalanceLots: [
        {
          id: 'bal-06',
          originDayId: 'production-day-2026-10-06',
          familyId: 'manto-crudo',
          productId: 'manto-japones-crudo',
          sourceProductId: 'manto-japones-crudo',
          originalKg100: kg100(1250),
          uses: [
            {
              id: 'use-06',
              targetDayId: 'production-day-freezing-2026-10-06',
              shift: 'DAY',
              kg100: kg100(1250),
            },
          ],
        },
      ],
      nucaWashAuthorization: null,
      performanceReferenceBasisPoints: 8000,
      nucaBikiniReferenceBasisPoints: 700,
      rawMaterialAllocationOverridesKg100: {},
    }

    // 07-10-2026: Envasado matching user Excel
    const day07Packing: ProductionDay = {
      id: 'production-day-2026-10-07',
      date: '2026-10-07',
      displayName: 'Miércoles 07/10/2026',
      status: 'CLOSED',
      captureRequiredDataComplete: true,
      process: 'PACKING',
      operationMode: 'NORMAL',
      rawMaterialEntries: [],
      declaredRawMaterialKg100: kg100(9960),
      declaredShiftTotalsKg100: { DAY: kg100(9960), NIGHT: kg100(0) },
      declaredFinishedTotalKg100: kg100(9960),
      hasTunnelProduction: false,
      lines: [
        {
          familyId: 'manto-crudo',
          familyName: 'MANTO CRUDO',
          productId: 'manto-japones-crudo',
          productName:
            'MANTO JAPONES CRUDO CONGELADO BLOCK S/TTO 2 KG - 4 KG SB 100% P.N.',
          summaryGroupId: 'MANTO',
          source: { sheet: '07-10-2026', cell: 'B1' },
          shiftBreakdownConfidence: 'EXPLICIT',
          shifts: {
            DAY: { reportedKg100: kg100(560), adjustments: [] },
            NIGHT: { reportedKg100: kg100(0), adjustments: [] },
          },
          treatmentKg100: kg100(0),
          newClosingBalanceKg100: kg100(0),
          declaredFinishedKg100: kg100(560),
        },
        {
          familyId: 'anillas',
          familyName: 'ANILLAS',
          productId: 'anillas-espana-polar-mixta',
          productName:
            'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P POLAR SM SP ST MIXTA 100% P.N.',
          summaryGroupId: 'ANILLAS',
          source: { sheet: '07-10-2026', cell: 'B2' },
          shiftBreakdownConfidence: 'EXPLICIT',
          shifts: {
            DAY: { reportedKg100: kg100(1190), adjustments: [] },
            NIGHT: { reportedKg100: kg100(0), adjustments: [] },
          },
          treatmentKg100: kg100(0),
          newClosingBalanceKg100: kg100(0),
          declaredFinishedKg100: kg100(1190),
        },
        {
          familyId: 'anillas',
          familyName: 'ANILLAS',
          productId: 'anillas-espana-p-sm-cp-st-mixta',
          productName:
            'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P SM CP ST MIXTA 100% P.N.',
          summaryGroupId: 'ANILLAS',
          source: { sheet: '07-10-2026', cell: 'B3' },
          shiftBreakdownConfidence: 'EXPLICIT',
          shifts: {
            DAY: { reportedKg100: kg100(420), adjustments: [] },
            NIGHT: { reportedKg100: kg100(0), adjustments: [] },
          },
          treatmentKg100: kg100(0),
          newClosingBalanceKg100: kg100(0),
          declaredFinishedKg100: kg100(420),
        },
        {
          familyId: 'manto-crudo',
          familyName: 'MANTO CRUDO',
          productId: 'conos-con-piel-crudos',
          productName: 'CONOS CON PIEL CRUDOS CONGELADOS BLOCK S/TTO 100% P.N.',
          summaryGroupId: 'MANTO',
          source: { sheet: '07-10-2026', cell: 'B4' },
          shiftBreakdownConfidence: 'EXPLICIT',
          shifts: {
            DAY: { reportedKg100: kg100(330), adjustments: [] },
            NIGHT: { reportedKg100: kg100(0), adjustments: [] },
          },
          treatmentKg100: kg100(0),
          newClosingBalanceKg100: kg100(0),
          declaredFinishedKg100: kg100(330),
        },
      ],
      receivedBalanceLots: [],
      nucaWashAuthorization: null,
      performanceReferenceBasisPoints: 8000,
      nucaBikiniReferenceBasisPoints: 700,
      rawMaterialAllocationOverridesKg100: {},
    }

    const allDays = [
      day05Packing,
      day05Freezing,
      day06Packing,
      day06Freezing,
      day07Packing,
    ]

    const draft = createEmptyCaptureDraft('2026-10-07', 'FREEZING')
    draft.rows = [
      {
        key: 'r-manto',
        product: {
          familyId: 'manto-crudo',
          familyName: 'MANTO CRUDO',
          productId: 'manto-japones-crudo',
          productName:
            'MANTO JAPONES CRUDO CONGELADO BLOCK S/TTO 2 KG - 4 KG SB 100% P.N.',
          summaryGroupId: 'MANTO',
        },
        dayReportedKg: '560',
        nightReportedKg: '0',
        dayPreviousBalanceKg: '0',
        nightPreviousBalanceKg: '0',
        tunnelDayKg: '0',
        tunnelNightKg: '0',
        treatmentKg: '0',
        closingBalanceKg: '0',
        finishedKg: '560',
      },
      {
        key: 'r-anillas-polar',
        product: {
          familyId: 'anillas',
          familyName: 'ANILLAS',
          productId: 'anillas-espana-polar-mixta',
          productName:
            'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P POLAR SM SP ST MIXTA 100% P.N.',
          summaryGroupId: 'ANILLAS',
        },
        dayReportedKg: '1190',
        nightReportedKg: '0',
        dayPreviousBalanceKg: '0',
        nightPreviousBalanceKg: '0',
        tunnelDayKg: '0',
        tunnelNightKg: '0',
        treatmentKg: '0',
        closingBalanceKg: '0',
        finishedKg: '1190',
      },
      {
        key: 'r-anillas-cp',
        product: {
          familyId: 'anillas',
          familyName: 'ANILLAS',
          productId: 'anillas-espana-p-sm-cp-st-mixta',
          productName:
            'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P SM CP ST MIXTA 100% P.N.',
          summaryGroupId: 'ANILLAS',
        },
        dayReportedKg: '410',
        nightReportedKg: '0',
        dayPreviousBalanceKg: '0',
        nightPreviousBalanceKg: '0',
        tunnelDayKg: '0',
        tunnelNightKg: '0',
        treatmentKg: '0',
        closingBalanceKg: '0',
        finishedKg: '410',
      },
      {
        key: 'r-conos',
        product: {
          familyId: 'manto-crudo',
          familyName: 'MANTO CRUDO',
          productId: 'conos-con-piel-crudos',
          productName: 'CONOS CON PIEL CRUDOS CONGELADOS BLOCK S/TTO 100% P.N.',
          summaryGroupId: 'MANTO',
        },
        dayReportedKg: '330',
        nightReportedKg: '0',
        dayPreviousBalanceKg: '0',
        nightPreviousBalanceKg: '0',
        tunnelDayKg: '0',
        tunnelNightKg: '0',
        treatmentKg: '0',
        closingBalanceKg: '0',
        finishedKg: '330',
      },
    ]

    const { result } = renderHook(() =>
      useFreezingTraceability({
        isFreezing: true,
        allProductionDays: allDays,
        draft,
        catalogItems: [],
        totalReportedKg100: kg100(2490),
      }),
    )

    // Verification 1: Potential availability on 07-10 evaluates same day Envasado!
    // Manto must be 560 (from 07-10), NOT 570 (from 05-10)!
    expect(
      result.current.getFreezingPotentialAvailabilityKg100(
        'manto-japones-crudo',
      ),
    ).toBe(kg100(560))

    // Anillas Polar must be 1190!
    expect(
      result.current.getFreezingPotentialAvailabilityKg100(
        'anillas-espana-polar-mixta',
      ),
    ).toBe(kg100(1190))

    // Anillas SM CP ST must be 420!
    expect(
      result.current.getFreezingPotentialAvailabilityKg100(
        'anillas-espana-p-sm-cp-st-mixta',
      ),
    ).toBe(kg100(420))

    // Conos must be 330!
    expect(
      result.current.getFreezingPotentialAvailabilityKg100(
        'conos-con-piel-crudos',
      ),
    ).toBe(kg100(330))

    // Verification 2: Same-day Envasado (560 kg) covers the reported 560 kg directly without creating balance cards
    const mantoAllocSameDay = buildFreezingFifoAllocation({
      targetProduct: draft.rows[0]!.product,
      targetDate: '2026-10-07',
      reportedDayKg100: kg100(560),
      reportedNightKg100: kg100(0),
      positions: result.current.freezingAutomaticOriginPositions,
      existingUses: [],
    })
    expect(mantoAllocSameDay.balanceUses).toHaveLength(0)

    // If reported exceeds same-day (e.g. 600 kg reported), FIFO links remaining 40 kg to oldest available origin (2026-10-05)
    const mantoAllocExcess = buildFreezingFifoAllocation({
      targetProduct: draft.rows[0]!.product,
      targetDate: '2026-10-07',
      reportedDayKg100: kg100(600),
      reportedNightKg100: kg100(0),
      positions: result.current.freezingAutomaticOriginPositions,
      existingUses: [],
    })
    expect(mantoAllocExcess.balanceUses).toHaveLength(1)
    expect(mantoAllocExcess.balanceUses[0]!.originDate).toBe('2026-10-05')
    expect(mantoAllocExcess.balanceUses[0]!.dayKg).toBe('0.4')

    // Status checks
    // Manto: reported 560, available 560, linked 560 -> CUADRADO
    const mantoStatus = freezingTraceabilityStatus(
      kg100(560),
      kg100(560),
      kg100(560),
    )
    expect(mantoStatus.label).toBe('CUADRADO')
    expect(mantoStatus.differenceKg100).toBe(kg100(0))

    // Anillas SM CP ST: reported 410, available 420, linked 410 -> EXCEDENTE (10 kg pending in Envasado)
    const anillasCpStatus = freezingTraceabilityStatus(
      kg100(410),
      kg100(420),
      kg100(410),
    )
    expect(anillasCpStatus.label).toBe('EXCEDENTE')
    expect(anillasCpStatus.differenceKg100).toBe(kg100(10))
  })

  it('updates draft date automatically when importing Excel with sheet name 07-10-2026', () => {
    const initialDraft = createEmptyCaptureDraft('2026-10-05', 'FREEZING')
    const updated = buildUpdatedFreezingDraft(initialDraft, {
      fileName: 'control_produccion.xlsx',
      sheetName: '07-10-2026',
      shift: 'DAY',
      totalAros: 56,
      totalKg: 560,
      sourceGrandTotalAros: null,
      sourceGrandTotalKg: null,
      recognizedRows: 1,
      reviewRows: 0,
      rows: [
        {
          rowNumber: 1,
          rawProductName:
            'MANTO JAPONES CRUDO CONGELADO BLOCK S/TTO 2 KG - 4 KG SB 100% P.N.',
          baseProductName:
            'MANTO JAPONES CRUDO CONGELADO BLOCK S/TTO 2 KG - 4 KG SB 100% P.N.',
          packaging: null,
          quantityAros: 56,
          totalKg: 560,
          product: {
            productId: 'manto-japones-crudo',
            productName:
              'MANTO JAPONES CRUDO CONGELADO BLOCK S/TTO 2 KG - 4 KG SB 100% P.N.',
            familyId: 'manto-crudo',
            familyName: 'MANTO CRUDO',
            summaryGroupId: 'MANTO',
          },
          status: 'COINCIDENCIA EXACTA',
        },
      ],
      warnings: [],
      reconciled: true,
      status: 'EXCEL RECONCILIADO',
    })

    expect(updated.date).toBe('2026-10-07')
    expect(updated.balanceUses).toEqual([])
  })

  it('demonstrates that changing draft date from 2026-10-06 to 2026-10-07 resolves the zero linkage issue', () => {
    // Upstream Envasado was saved on 2026-10-07
    const day07Packing: ProductionDay = {
      id: 'production-day-2026-10-07',
      date: '2026-10-07',
      displayName: 'Miércoles 07/10/2026',
      status: 'CLOSED',
      captureRequiredDataComplete: true,
      process: 'PACKING',
      operationMode: 'NORMAL',
      rawMaterialEntries: [],
      declaredRawMaterialKg100: kg100(9960),
      declaredShiftTotalsKg100: { DAY: kg100(9960), NIGHT: kg100(0) },
      declaredFinishedTotalKg100: kg100(9960),
      hasTunnelProduction: false,
      lines: [
        {
          familyId: 'manto-crudo',
          familyName: 'MANTO CRUDO',
          productId: 'manto-japones-crudo',
          productName:
            'MANTO JAPONES CRUDO CONGELADO BLOCK S/TTO 2 KG - 4 KG SB 100% P.N.',
          summaryGroupId: 'MANTO',
          source: { sheet: '07-10-2026', cell: 'B1' },
          shiftBreakdownConfidence: 'EXPLICIT',
          shifts: {
            DAY: { reportedKg100: kg100(560), adjustments: [] },
            NIGHT: { reportedKg100: kg100(0), adjustments: [] },
          },
          treatmentKg100: kg100(0),
          newClosingBalanceKg100: kg100(0),
          declaredFinishedKg100: kg100(560),
        },
      ],
      receivedBalanceLots: [],
      nucaWashAuthorization: null,
      performanceReferenceBasisPoints: 8000,
      nucaBikiniReferenceBasisPoints: 700,
      rawMaterialAllocationOverridesKg100: {},
    }

    const allDays = [day07Packing]

    const draftTuesday = {
      ...createEmptyCaptureDraft('2026-10-06', 'FREEZING'),
      rows: [
        {
          key: 'r-manto',
          product: {
            familyId: 'manto-crudo',
            familyName: 'MANTO CRUDO',
            productId: 'manto-japones-crudo',
            productName:
              'MANTO JAPONES CRUDO CONGELADO BLOCK S/TTO 2 KG - 4 KG SB 100% P.N.',
            summaryGroupId: 'MANTO' as const,
          },
          dayReportedKg: '560',
          nightReportedKg: '0',
          dayPreviousBalanceKg: '0',
          nightPreviousBalanceKg: '0',
          tunnelDayKg: '0',
          tunnelNightKg: '0',
          treatmentKg: '0',
          closingBalanceKg: '0',
          finishedKg: '560',
        },
      ],
    }

    // On 2026-10-06 (Tuesday), FIFO allocation cannot see Wednesday's Envasado
    const { result: resultTuesday } = renderHook(() =>
      useFreezingTraceability({
        isFreezing: true,
        allProductionDays: allDays,
        draft: draftTuesday,
        catalogItems: [],
        totalReportedKg100: kg100(560),
      }),
    )

    expect(
      resultTuesday.current.getFreezingPotentialAvailabilityKg100(
        'manto-japones-crudo',
      ),
    ).toBe(0)
    expect(resultTuesday.current.freezingAutomaticOriginPositions).toHaveLength(0)

    // Once date is corrected to 2026-10-07 (Wednesday), FIFO allocation links all 560 kg!
    const draftWednesday = {
      ...draftTuesday,
      date: '2026-10-07',
    }

    const { result: resultWednesday } = renderHook(() =>
      useFreezingTraceability({
        isFreezing: true,
        allProductionDays: allDays,
        draft: draftWednesday,
        catalogItems: [],
        totalReportedKg100: kg100(560),
      }),
    )

    expect(
      resultWednesday.current.getFreezingPotentialAvailabilityKg100(
        'manto-japones-crudo',
      ),
    ).toBe(kg100(560))

    const mantoAlloc = buildFreezingFifoAllocation({
      targetProduct: draftWednesday.rows[0]!.product,
      targetDate: '2026-10-07',
      reportedDayKg100: kg100(560),
      reportedNightKg100: kg100(0),
      positions: resultWednesday.current.freezingAutomaticOriginPositions,
      existingUses: [],
    })

    expect(mantoAlloc.balanceUses).toHaveLength(0)
  })
})
