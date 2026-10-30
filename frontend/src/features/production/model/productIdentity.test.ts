import { describe, expect, it } from 'vitest'
import { productIdsEquivalent } from './productIdentity'

describe('product identity across production stages', () => {
  it('links a SACO variant to its Envasado base without merging variants', () => {
    expect(
      productIdsEquivalent(
        'saco-manto-estandar-crudo-congelado-block-stto-c-02-memb-2-kg-4-kg-sb-100-pn-saco-2-x-10-kg',
        'manto-estandar-crudo-2-4',
      ),
    ).toBe(true)
    expect(
      productIdsEquivalent(
        'saco-manto-estandar-crudo-congelado-block-stto-c-02-memb-2-kg-4-kg-sb-100-pn-saco-2-x-10-kg',
        'saco-anillas-crudas-congeladas-block-stto-espana-p-sm-cp-st-mixta-100-pn-saco-3-x-10-kg',
      ),
    ).toBe(false)
  })
})
