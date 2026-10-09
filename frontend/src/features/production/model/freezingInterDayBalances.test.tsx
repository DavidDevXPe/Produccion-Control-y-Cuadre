import { describe, expect, it } from 'vitest'
import { kg100 } from './calculations'
import { calculateStageAvailability } from './freezing'
import {
  buildProductionDayFromCapture,
  createCaptureDraftFromDay,
  createEmptyCaptureDraft,
} from '../capture/productionCapture'
import { buildBalanceShiftDiagnostics, validateProductionClosure } from './businessRules'

describe('Inter-Day Freezing Balances (Saldos pendientes de congelar)', () => {
  const sampleProduct = {
    familyId: 'anillas',
    familyName: 'ANILLAS',
    productId: 'anillas-espana-p-sm-cp-st-mixta',
    productName:
      'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P SM CP ST MIXTA 100% P.N.',
    summaryGroupId: 'ANILLAS' as const,
  }

  it('correctly tracks and freezes an outstanding balance from 08/10/2026 on 09/10/2026', () => {
    // Step 1: Day 1 (08/10/2026) - Envasado (PACKING) of 1000 kg
    const draftPacking08 = createEmptyCaptureDraft('2026-10-08', 'PACKING')
    draftPacking08.rawMaterialKg = '2500'
    draftPacking08.declaredDayTotalKg = '1000'
    draftPacking08.declaredNightTotalKg = '0'
    draftPacking08.rows = [
      {
        key: 'row-packing-08',
        product: sampleProduct,
        dayReportedKg: '1000',
        nightReportedKg: '0',
        dayPreviousBalanceKg: '0',
        nightPreviousBalanceKg: '0',
        tunnelDayKg: '0',
        tunnelNightKg: '0',
        treatmentKg: '0',
        closingBalanceKg: '0',
        finishedKg: '1000',
      },
    ]

    const packing08Result = buildProductionDayFromCapture(
      draftPacking08,
      [],
      [],
      'CLOSED',
    )
    expect(packing08Result.inputErrors).toHaveLength(0)
    const day08Packing = packing08Result.productionDay

    // Step 2: Day 1 (08/10/2026) - Congelamiento (FREEZING) freezes 850 kg, leaving 150 kg pending
    const draftFreezing08 = createEmptyCaptureDraft('2026-10-08', 'FREEZING')
    draftFreezing08.declaredDayTotalKg = '850'
    draftFreezing08.declaredNightTotalKg = '0'
    draftFreezing08.rows = [
      {
        key: 'row-freezing-08',
        product: sampleProduct,
        dayReportedKg: '850',
        nightReportedKg: '0',
        dayPreviousBalanceKg: '0',
        nightPreviousBalanceKg: '0',
        tunnelDayKg: '0',
        tunnelNightKg: '0',
        treatmentKg: '0',
        closingBalanceKg: '0',
        finishedKg: '850',
      },
    ]
    draftFreezing08.balanceUses = [
      {
        key: `balance-${day08Packing.id}-${sampleProduct.productId}`,
        originDayId: day08Packing.id,
        originDate: '2026-10-08',
        familyId: sampleProduct.familyId,
        familyName: sampleProduct.familyName,
        productId: sampleProduct.productId,
        productName: sampleProduct.productName,
        availableKg100: kg100(1000 * 100),
        dayKg: '850',
        nightKg: '0',
        requiresProductDistribution: false,
      },
    ]

    const freezing08Result = buildProductionDayFromCapture(
      draftFreezing08,
      [day08Packing],
      [],
      'CLOSED',
    )
    expect(freezing08Result.inputErrors).toHaveLength(0)
    const day08Freezing = freezing08Result.productionDay

    // Verify 08/10 availability after 08/10 Freezing
    const availabilityAfter08 = calculateStageAvailability('FREEZING', [
      day08Packing,
      day08Freezing,
    ])
    expect(availabilityAfter08).toHaveLength(1)
    expect(availabilityAfter08[0]!.generatedKg100).toBe(kg100(1000 * 100))
    expect(availabilityAfter08[0]!.processedTotalKg100).toBe(kg100(850 * 100))
    expect(availabilityAfter08[0]!.pendingKg100).toBe(kg100(150 * 100)) // Exactly 150 kg pending!

    // Step 3: Day 2 (09/10/2026) - Congelamiento (FREEZING) freezes the 150 kg pending balance in Turno Día
    const draftFreezing09 = createEmptyCaptureDraft('2026-10-09', 'FREEZING')
    draftFreezing09.declaredDayTotalKg = '150'
    draftFreezing09.declaredNightTotalKg = '0'
    draftFreezing09.rows = [
      {
        key: 'row-freezing-09',
        product: sampleProduct,
        dayReportedKg: '150',
        nightReportedKg: '0',
        dayPreviousBalanceKg: '0',
        nightPreviousBalanceKg: '0',
        tunnelDayKg: '0',
        tunnelNightKg: '0',
        treatmentKg: '0',
        closingBalanceKg: '0',
        finishedKg: '150',
      },
    ]
    // User registers the pending balance from 08/10/2026
    draftFreezing09.balanceUses = [
      {
        key: `balance-${day08Packing.id}-${sampleProduct.productId}`,
        originDayId: day08Packing.id,
        originDate: '2026-10-08', // Origin date preserved!
        familyId: sampleProduct.familyId,
        familyName: sampleProduct.familyName,
        productId: sampleProduct.productId,
        productName: sampleProduct.productName,
        availableKg100: availabilityAfter08[0]!.pendingKg100, // 150 kg available
        dayKg: '150', // 150 kg frozen in Day shift today
        nightKg: '0',
        requiresProductDistribution: false,
      },
    ]

    const allDays = [day08Packing, day08Freezing]
    const freezing09Result = buildProductionDayFromCapture(
      draftFreezing09,
      allDays,
      [],
      'CLOSED',
    )
    expect(freezing09Result.inputErrors).toHaveLength(0)
    const day09Freezing = freezing09Result.productionDay

    // Requirement 2: Real Freezing date is 09/10/2026, origin date is 08/10/2026
    expect(day09Freezing.date).toBe('2026-10-09')
    expect(day09Freezing.receivedBalanceLots).toHaveLength(1)
    expect(day09Freezing.receivedBalanceLots[0]!.originDayId).toBe(day08Packing.id)
    expect(day09Freezing.receivedBalanceLots[0]!.uses).toHaveLength(1)
    expect(day09Freezing.receivedBalanceLots[0]!.uses[0]!.shift).toBe('DAY')
    expect(day09Freezing.receivedBalanceLots[0]!.uses[0]!.kg100).toBe(kg100(150 * 100))

    // Requirement 3 & 4: Business rules, validations and no excess diagnostics
    const diagnostics09 = buildBalanceShiftDiagnostics(freezing09Result.calculation)
    expect(diagnostics09).toHaveLength(0) // No "saldo mal distribuido" error!

    const closureValidation09 = validateProductionClosure(
      day09Freezing,
      freezing09Result.calculation,
      {
        requiredDataComplete: true,
        inputErrors: [],
      },
    )
    expect(closureValidation09.canClose).toBe(true)
    expect(closureValidation09.blockers).toHaveLength(0)

    // Verification of availability after 09/10 Freezing
    const availabilityAfter09 = calculateStageAvailability('FREEZING', [
      day08Packing,
      day08Freezing,
      day09Freezing,
    ])
    expect(availabilityAfter09).toHaveLength(1)
    expect(availabilityAfter09[0]!.generatedKg100).toBe(kg100(1000 * 100))
    expect(availabilityAfter09[0]!.processedTotalKg100).toBe(kg100(1000 * 100)) // 850 + 150 = 1000
    expect(availabilityAfter09[0]!.pendingKg100).toBe(kg100(0)) // Fully consumed!

    // Requirement 5: Draft reconstructed from day preserves all data and origin
    const restoredDraft = createCaptureDraftFromDay(day09Freezing, [day08Packing])
    expect(restoredDraft.date).toBe('2026-10-09')
    expect(restoredDraft.balanceUses).toHaveLength(1)
    expect(restoredDraft.balanceUses[0]!.originDate).toBe('2026-10-08')
    expect(restoredDraft.balanceUses[0]!.dayKg).toBe('150')
    expect(restoredDraft.rows[0]!.dayReportedKg).toBe('150')
  })

  it('supports partial freezing of a pending balance across multiple journeys', () => {
    // 08/10 Envasado 1000 kg, Freezing 800 kg -> 200 kg pending
    const day08PackingResult = buildProductionDayFromCapture(
      {
        ...createEmptyCaptureDraft('2026-10-08', 'PACKING'),
        declaredDayTotalKg: '1000',
        declaredNightTotalKg: '0',
        rows: [
          {
            key: 'r1',
            product: sampleProduct,
            dayReportedKg: '1000',
            nightReportedKg: '0',
            dayPreviousBalanceKg: '0',
            nightPreviousBalanceKg: '0',
            tunnelDayKg: '0',
            tunnelNightKg: '0',
            treatmentKg: '0',
            closingBalanceKg: '0',
            finishedKg: '1000',
          },
        ],
      },
      [],
      [],
      'CLOSED',
    )
    const day08Packing = day08PackingResult.productionDay

    const day08Freezing = buildProductionDayFromCapture(
      {
        ...createEmptyCaptureDraft('2026-10-08', 'FREEZING'),
        declaredDayTotalKg: '800',
        declaredNightTotalKg: '0',
        rows: [
          {
            key: 'r1',
            product: sampleProduct,
            dayReportedKg: '800',
            nightReportedKg: '0',
            dayPreviousBalanceKg: '0',
            nightPreviousBalanceKg: '0',
            tunnelDayKg: '0',
            tunnelNightKg: '0',
            treatmentKg: '0',
            closingBalanceKg: '0',
            finishedKg: '800',
          },
        ],
        balanceUses: [
          {
            key: `bal-${day08Packing.id}`,
            originDayId: day08Packing.id,
            originDate: '2026-10-08',
            familyId: sampleProduct.familyId,
            familyName: sampleProduct.familyName,
            productId: sampleProduct.productId,
            productName: sampleProduct.productName,
            availableKg100: kg100(1000 * 100),
            dayKg: '800',
            nightKg: '0',
            requiresProductDistribution: false,
          },
        ],
      },
      [day08Packing],
      [],
      'CLOSED',
    ).productionDay

    // 09/10 Freezing freezes 120 kg (leaving 80 kg pending)
    const day09Freezing = buildProductionDayFromCapture(
      {
        ...createEmptyCaptureDraft('2026-10-09', 'FREEZING'),
        declaredDayTotalKg: '120',
        declaredNightTotalKg: '0',
        rows: [
          {
            key: 'r1',
            product: sampleProduct,
            dayReportedKg: '120',
            nightReportedKg: '0',
            dayPreviousBalanceKg: '0',
            nightPreviousBalanceKg: '0',
            tunnelDayKg: '0',
            tunnelNightKg: '0',
            treatmentKg: '0',
            closingBalanceKg: '0',
            finishedKg: '120',
          },
        ],
        balanceUses: [
          {
            key: `bal-${day08Packing.id}`,
            originDayId: day08Packing.id,
            originDate: '2026-10-08',
            familyId: sampleProduct.familyId,
            familyName: sampleProduct.familyName,
            productId: sampleProduct.productId,
            productName: sampleProduct.productName,
            availableKg100: kg100(200 * 100),
            dayKg: '120',
            nightKg: '0',
            requiresProductDistribution: false,
          },
        ],
      },
      [day08Packing, day08Freezing],
      [],
      'CLOSED',
    ).productionDay

    const avail09 = calculateStageAvailability('FREEZING', [
      day08Packing,
      day08Freezing,
      day09Freezing,
    ])
    expect(avail09[0]!.pendingKg100).toBe(kg100(80 * 100)) // 80 kg left!

    // 10/10 Freezing freezes the remaining 80 kg
    const day10Freezing = buildProductionDayFromCapture(
      {
        ...createEmptyCaptureDraft('2026-10-10', 'FREEZING'),
        declaredDayTotalKg: '80',
        declaredNightTotalKg: '0',
        rows: [
          {
            key: 'r1',
            product: sampleProduct,
            dayReportedKg: '80',
            nightReportedKg: '0',
            dayPreviousBalanceKg: '0',
            nightPreviousBalanceKg: '0',
            tunnelDayKg: '0',
            tunnelNightKg: '0',
            treatmentKg: '0',
            closingBalanceKg: '0',
            finishedKg: '80',
          },
        ],
        balanceUses: [
          {
            key: `bal-${day08Packing.id}`,
            originDayId: day08Packing.id,
            originDate: '2026-10-08',
            familyId: sampleProduct.familyId,
            familyName: sampleProduct.familyName,
            productId: sampleProduct.productId,
            productName: sampleProduct.productName,
            availableKg100: kg100(80 * 100),
            dayKg: '80',
            nightKg: '0',
            requiresProductDistribution: false,
          },
        ],
      },
      [day08Packing, day08Freezing, day09Freezing],
      [],
      'CLOSED',
    ).productionDay

    const avail10 = calculateStageAvailability('FREEZING', [
      day08Packing,
      day08Freezing,
      day09Freezing,
      day10Freezing,
    ])
    expect(avail10[0]!.pendingKg100).toBe(kg100(0)) // Fully consumed!
    expect(avail10[0]!.processedTotalKg100).toBe(kg100(1000 * 100)) // Exact 1000 kg across all 3 freezing days!
  })

  it('calculates pending balance deducting physical freezing of same day, filtering out completed products (User Request #10)', () => {
    const productA = {
      familyId: 'anillas',
      familyName: 'ANILLAS',
      productId: 'anillas-espana-p-sm-cp-st-mixta',
      productName:
        'ANILLAS CRUDAS CONGELADAS BLOCK S/TTO ESPAÑA P SM CP ST MIXTA 100% P.N.',
      summaryGroupId: 'ANILLAS' as const,
    }

    const productB = {
      familyId: 'manto',
      familyName: 'MANTO',
      productId: 'manto-entero-congelado',
      productName: 'MANTO ENTERO CONGELADO 100% P.N.',
      summaryGroupId: 'MANTO' as const,
    }

    // Step 1: 08/10/2026 Envasado produces 500 kg of Product A and 500 kg of Product B
    const day08Packing = buildProductionDayFromCapture(
      {
        ...createEmptyCaptureDraft('2026-10-08', 'PACKING'),
        rawMaterialKg: '2000',
        declaredDayTotalKg: '1000',
        declaredNightTotalKg: '0',
        rows: [
          {
            key: 'row-packing-a',
            product: productA,
            dayReportedKg: '500',
            nightReportedKg: '0',
            dayPreviousBalanceKg: '0',
            nightPreviousBalanceKg: '0',
            tunnelDayKg: '0',
            tunnelNightKg: '0',
            treatmentKg: '0',
            closingBalanceKg: '0',
            finishedKg: '500',
          },
          {
            key: 'row-packing-b',
            product: productB,
            dayReportedKg: '500',
            nightReportedKg: '0',
            dayPreviousBalanceKg: '0',
            nightPreviousBalanceKg: '0',
            tunnelDayKg: '0',
            tunnelNightKg: '0',
            treatmentKg: '0',
            closingBalanceKg: '0',
            finishedKg: '500',
          },
        ],
      },
      [],
      [],
      'CLOSED',
    ).productionDay

    // Step 2: 08/10/2026 Congelamiento reports:
    // Product A: 300 kg Día, 100 kg Noche (400 kg total frozen, leaving 100 kg pending)
    // Product B: 500 kg Día, 0 kg Noche (500 kg total frozen, leaving 0 kg pending)
    const day08Freezing = buildProductionDayFromCapture(
      {
        ...createEmptyCaptureDraft('2026-10-08', 'FREEZING'),
        declaredDayTotalKg: '800',
        declaredNightTotalKg: '100',
        rows: [
          {
            key: 'row-freezing-a',
            product: productA,
            dayReportedKg: '300',
            nightReportedKg: '100',
            dayPreviousBalanceKg: '0',
            nightPreviousBalanceKg: '0',
            tunnelDayKg: '0',
            tunnelNightKg: '0',
            treatmentKg: '0',
            closingBalanceKg: '0',
            finishedKg: '400',
          },
          {
            key: 'row-freezing-b',
            product: productB,
            dayReportedKg: '500',
            nightReportedKg: '0',
            dayPreviousBalanceKg: '0',
            nightPreviousBalanceKg: '0',
            tunnelDayKg: '0',
            tunnelNightKg: '0',
            treatmentKg: '0',
            closingBalanceKg: '0',
            finishedKg: '500',
          },
        ],
      },
      [day08Packing],
      [],
      'CLOSED',
    ).productionDay

    // Step 3: Check availability as of 09/10/2026
    const availabilityPositions = calculateStageAvailability('FREEZING', [
      day08Packing,
      day08Freezing,
    ])

    const posA = availabilityPositions.find(
      (p) => p.productId === productA.productId,
    )
    const posB = availabilityPositions.find(
      (p) => p.productId === productB.productId,
    )

    expect(posA).toBeDefined()
    expect(posA!.generatedKg100).toBe(kg100(500 * 100))
    expect(posA!.processedTotalKg100).toBe(kg100(400 * 100))
    expect(posA!.pendingKg100).toBe(kg100(100 * 100)) // Exactly 100 kg pending!

    expect(posB).toBeDefined()
    expect(posB!.generatedKg100).toBe(kg100(500 * 100))
    expect(posB!.processedTotalKg100).toBe(kg100(500 * 100))
    expect(posB!.pendingKg100).toBe(kg100(0)) // 100% frozen, 0 kg pending!

    // The selector only includes positions with pendingKg100 > 0
    const availableForSelector = availabilityPositions.filter(
      (p) => p.pendingKg100 > 0,
    )
    expect(availableForSelector).toHaveLength(1)
    expect(availableForSelector[0]!.productId).toBe(productA.productId)
    expect(availableForSelector[0]!.pendingKg100).toBe(kg100(100 * 100))

    // Step 4: On 09/10/2026, the 100 kg is frozen in Día
    const day09Freezing = buildProductionDayFromCapture(
      {
        ...createEmptyCaptureDraft('2026-10-09', 'FREEZING'),
        declaredDayTotalKg: '100',
        declaredNightTotalKg: '0',
        rows: [
          {
            key: 'row-freezing-09-a',
            product: productA,
            dayReportedKg: '100',
            nightReportedKg: '0',
            dayPreviousBalanceKg: '0',
            nightPreviousBalanceKg: '0',
            tunnelDayKg: '0',
            tunnelNightKg: '0',
            treatmentKg: '0',
            closingBalanceKg: '0',
            finishedKg: '100',
          },
        ],
        balanceUses: [
          {
            key: `bal-${day08Packing.id}-${productA.productId}`,
            originDayId: day08Packing.id,
            originDate: '2026-10-08',
            familyId: productA.familyId,
            familyName: productA.familyName,
            productId: productA.productId,
            productName: productA.productName,
            availableKg100: kg100(100 * 100),
            dayKg: '100',
            nightKg: '0',
            requiresProductDistribution: false,
          },
        ],
      },
      [day08Packing, day08Freezing],
      [],
      'CLOSED',
    ).productionDay

    // Check availability after 09/10/2026
    const availabilityAfter09 = calculateStageAvailability('FREEZING', [
      day08Packing,
      day08Freezing,
      day09Freezing,
    ])

    const posAAfter = availabilityAfter09.find(
      (p) => p.productId === productA.productId,
    )
    expect(posAAfter!.processedTotalKg100).toBe(kg100(500 * 100))
    expect(posAAfter!.pendingKg100).toBe(kg100(0)) // Fully consumed!

    const openAfter09 = availabilityAfter09.filter((p) => p.pendingKg100 > 0)
    expect(openAfter09).toHaveLength(0) // Disappears from future selectors!
  })
})
