import { describe, expect, it } from 'vitest'
import { buildClosureReviewItems } from './closureReview'

describe('buildClosureReviewItems', () => {
  it('uses one deduplicated list for blockers and warnings', () => {
    const items = buildClosureReviewItems({
      pendingClosureReasons: ['Turno Día: faltan 10.00 kg', 'Producto inválido'],
      closureValidation: {
        canClose: false,
        blockers: [
          { code: 'DAY_REPORT_NOT_RECONCILED', message: 'Turno Día: faltan 10.00 kg' },
          { code: 'TUNNEL_MOVEMENTS_REQUIRED', message: 'Registra los movimientos de Túnel.' },
        ],
        warnings: [
          { code: 'GENERAL_YIELD_BELOW_MIN', message: 'El aprovechamiento está por debajo de la referencia.' },
        ],
      },
      diagnostics: [
        { code: 'SHIFT_BALANCED', message: 'No debe aparecer.' },
        { code: 'PRODUCT_RECONCILIATION_DIFFERENCE', message: 'Producto inválido' },
      ],
    })

    expect(items).toEqual([
      {
        id: 'blocker:pending:Turno Día: faltan 10.00 kg',
        severity: 'BLOCKER',
        message: 'Turno Día: faltan 10.00 kg',
      },
      {
        id: 'blocker:pending:Producto inválido',
        severity: 'BLOCKER',
        message: 'Producto inválido',
      },
      {
        id: 'blocker:validation:TUNNEL_MOVEMENTS_REQUIRED:Registra los movimientos de Túnel.',
        severity: 'BLOCKER',
        message: 'Registra los movimientos de Túnel.',
      },
      {
        id: 'warning:warning:GENERAL_YIELD_BELOW_MIN:El aprovechamiento está por debajo de la referencia.',
        severity: 'WARNING',
        message: 'El aprovechamiento está por debajo de la referencia.',
      },
    ])
  })
})
