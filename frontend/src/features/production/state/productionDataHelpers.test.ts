import { describe, expect, it } from 'vitest'
import { MONDAY_WEEK_42_PRODUCTION_DAY } from '../data/mondayWeek42'
import { normalizeNucaClassification } from './productionDataHelpers'

describe('normalizeNucaClassification', () => {
  it('repairs Bikini lines that were persisted under the semi-clean group', () => {
    const bikini = MONDAY_WEEK_42_PRODUCTION_DAY.lines.find((line) =>
      line.productId === 'nuca-bikini-300-500',
    )!
    const semilimpia = MONDAY_WEEK_42_PRODUCTION_DAY.lines.find((line) =>
      line.productId === 'nuca-semilimpia-codificada',
    )!

    const result = normalizeNucaClassification({
      ...MONDAY_WEEK_42_PRODUCTION_DAY,
      lines: [
        {
          ...bikini,
          familyId: 'nuca-semilimpia',
          familyName: 'NUCA SEMILIMPIA',
          summaryGroupId: 'NUCA_SEMILIMPIA',
        },
        semilimpia,
      ],
    })

    expect(result.lines[0]).toMatchObject({
      productId: 'nuca-bikini-300-500',
      familyId: 'nuca-bikini',
      familyName: 'NUCA BIKINI',
      summaryGroupId: 'NUCA_BIKINI',
    })
    expect(result.lines[1]).toMatchObject({
      productId: 'nuca-semilimpia-codificada',
      familyId: 'nuca-semilimpia',
      summaryGroupId: 'NUCA_SEMILIMPIA',
    })
  })
})
