import { beforeEach, describe, expect, it } from 'vitest'

import {
  createTrabundaBackup,
  parseTrabundaBackup,
  restoreTrabundaBackup,
} from './backupService'
import { TRABUNDA_STORAGE_KEYS } from '../../../storage/trabundaStorage'

describe('Trabunda backup service', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('exports a versioned backup with the central storage manifest', () => {
    localStorage.setItem(TRABUNDA_STORAGE_KEYS.productionDays, '[]')
    localStorage.setItem(TRABUNDA_STORAGE_KEYS.colorTheme, 'dark')

    const backup = createTrabundaBackup()

    expect(backup).toMatchObject({
      format: 'TRABUNDA_BACKUP',
      version: 1,
      data: {
        [TRABUNDA_STORAGE_KEYS.productionDays]: '[]',
        [TRABUNDA_STORAGE_KEYS.colorTheme]: 'dark',
      },
    })
  })

  it('accepts the legacy raw localStorage JSON shape and previews external origins', () => {
    const legacyBackup = JSON.stringify({
      [TRABUNDA_STORAGE_KEYS.productionDays]: JSON.stringify([
        {
          id: 'production-day-2026-09-08',
          date: '2026-09-08',
          displayName: 'Martes, 08 de septiembre de 2026',
          status: 'DRAFT',
          process: 'PACKING',
          rawMaterialEntries: [],
          declaredRawMaterialKg100: 0,
          declaredShiftTotalsKg100: { DAY: 0, NIGHT: 0 },
          declaredFinishedTotalKg100: 0,
          lines: [
            {
              familyId: 'aleta-cruda',
              familyName: 'ALETA CRUDA',
              productId: 'capture-seed-6',
              productName: 'ALETA HISTÓRICA',
              summaryGroupId: 'ALETA',
              source: { sheet: 'CAPTURA WEB', cell: 'A1' },
              shiftBreakdownConfidence: 'EXPLICIT',
              shifts: {
                DAY: { reportedKg100: 0, adjustments: [] },
                NIGHT: { reportedKg100: 0, adjustments: [] },
              },
              treatmentKg100: 0,
              newClosingBalanceKg100: 0,
              declaredFinishedKg100: 0,
            },
          ],
          receivedBalanceLots: [
            {
              id: 'legacy-origin',
              originDayId: 'production-day-2026-09-07',
              familyId: 'aleta-cruda',
              productId: 'capture-seed-6',
              originalKg100: 1000,
              uses: [],
            },
          ],
          nucaWashAuthorization: null,
          performanceReferenceBasisPoints: 8000,
          nucaBikiniReferenceBasisPoints: 700,
          rawMaterialAllocationOverridesKg100: {},
        },
      ]),
    })

    const preview = parseTrabundaBackup(legacyBackup)

    expect(preview.sourceFormat).toBe('LEGACY_LOCAL_STORAGE')
    expect(preview.productionDays).toBe(1)
    expect(preview.detectedHistoricalProductIds).toContain('capture-seed-6')
    expect(preview.detectedExternalOriginDayIds).toContain(
      'production-day-2026-09-07',
    )
  })

  it('restores only manifest keys and removes missing app keys to mirror the backup', () => {
    localStorage.setItem(TRABUNDA_STORAGE_KEYS.colorTheme, 'dark')
    localStorage.setItem(TRABUNDA_STORAGE_KEYS.productCatalog, '[{"stale":true}]')

    const preview = parseTrabundaBackup(
      JSON.stringify({
        format: 'TRABUNDA_BACKUP',
        version: 1,
        exportedAt: '2026-09-19T00:00:00.000Z',
        data: {
          [TRABUNDA_STORAGE_KEYS.colorTheme]: 'light',
          [TRABUNDA_STORAGE_KEYS.productionDays]: '[]',
        },
      }),
    )

    restoreTrabundaBackup(preview)

    expect(localStorage.getItem(TRABUNDA_STORAGE_KEYS.colorTheme)).toBe('light')
    expect(localStorage.getItem(TRABUNDA_STORAGE_KEYS.productionDays)).toBe('[]')
    expect(localStorage.getItem(TRABUNDA_STORAGE_KEYS.productCatalog)).toBeNull()
  })
})
