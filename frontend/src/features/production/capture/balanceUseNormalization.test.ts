import { describe, expect, it } from 'vitest'
import { kg100 } from '../model/calculations'
import {
  balanceUseIdentity,
  normalizeCaptureBalanceUses,
} from './balanceUseNormalization'
import type { ProductionCaptureBalanceUse } from './productionCapture'

function use(
  overrides: Partial<ProductionCaptureBalanceUse> = {},
): ProductionCaptureBalanceUse {
  return {
    key: 'balance-origin-a-manto',
    originDayId: 'origin-a',
    originDate: '2026-09-08',
    familyId: 'manto-crudo',
    familyName: 'MANTO CRUDO',
    productId: 'manto-estandar',
    productName: 'MANTO ESTANDAR',
    availableKg100: kg100(100_00),
    dayKg: '40',
    nightKg: '0',
    ...overrides,
  }
}

describe('capture balance use normalization', () => {
  it('keeps the largest quantity per shift and never sums duplicated copies', () => {
    const [normalized, ...rest] = normalizeCaptureBalanceUses([
      use({ key: 'copy-1', dayKg: '40', nightKg: '5' }),
      use({ key: 'copy-2', dayKg: '30', nightKg: '10' }),
      use({ key: 'copy-3', dayKg: '40', nightKg: '10' }),
    ])

    expect(rest).toHaveLength(0)
    expect(normalized).toMatchObject({ dayKg: '40', nightKg: '10' })
  })

  it('keeps the largest available quantity of the duplicated origin', () => {
    const [normalized] = normalizeCaptureBalanceUses([
      use({ availableKg100: kg100(80_00) }),
      use({ key: 'copy', availableKg100: kg100(120_00) }),
    ])

    expect(normalized?.availableKg100).toBe(kg100(120_00))
  })

  it('treats links to different origins or different source products as different identities', () => {
    const uses = [
      use(),
      use({ key: 'other-origin', originDayId: 'origin-b' }),
      use({ key: 'other-source', sourceProductId: 'manto-legacy' }),
    ]

    expect(new Set(uses.map(balanceUseIdentity)).size).toBe(3)
    expect(normalizeCaptureBalanceUses(uses)).toHaveLength(3)
  })

  it('keeps the source product and product-distribution flag when only one copy carries them', () => {
    const [normalized] = normalizeCaptureBalanceUses([
      use(),
      use({
        key: 'copy',
        sourceProductId: 'manto-estandar',
        requiresProductDistribution: true,
      }),
    ])

    expect(normalized).toMatchObject({
      sourceProductId: 'manto-estandar',
      requiresProductDistribution: true,
    })
  })

  it('is idempotent: normalizing an already normalized list changes nothing', () => {
    const once = normalizeCaptureBalanceUses([
      use({ key: 'copy-1', dayKg: '12,5' }),
      use({ key: 'copy-2', dayKg: '7' }),
      use({ key: 'other', originDayId: 'origin-b' }),
    ])

    expect(normalizeCaptureBalanceUses(once)).toEqual(once)
    expect(once[0]?.dayKg).toBe('12.5')
  })

  it('does not mutate its input', () => {
    const input = [use({ dayKg: '10' }), use({ key: 'copy', dayKg: '20' })]
    const snapshot = structuredClone(input)

    normalizeCaptureBalanceUses(input)

    expect(input).toEqual(snapshot)
  })
})
