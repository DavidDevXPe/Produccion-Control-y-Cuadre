import { afterEach, describe, expect, it } from 'vitest'
import { TRABUNDA_STORAGE_KEYS } from '../../../storage/trabundaStorage'
import {
  getActiveProducts,
  reloadActiveProductCatalog,
  resetActiveProductCatalogForTests,
} from './productCatalogRepository'

afterEach(() => {
  localStorage.clear()
  resetActiveProductCatalogForTests()
})

describe('stored catalog validation', () => {
  it('keeps valid products when neighboring records are incomplete or have invalid aliases', () => {
    const valid = { productId: 'custom-valid', productName: 'CUSTOM VALID', familyId: 'manto-crudo', familyName: 'MANTO CRUDO', summaryGroupId: 'MANTO' }
    localStorage.setItem(TRABUNDA_STORAGE_KEYS.productCatalog, JSON.stringify([
      valid, { productId: 'missing-name' }, { ...valid, productId: 'bad-aliases', aliases: {} },
    ]))
    resetActiveProductCatalogForTests()
    expect(getActiveProducts().some((product) => product.productId === 'custom-valid')).toBe(true)
    expect(getActiveProducts().some((product) => product.productId === 'missing-name')).toBe(false)
    expect(localStorage.getItem(TRABUNDA_STORAGE_KEYS.storageQuarantine)).toContain('bad-aliases')
  })

  it('reloads dynamic products written by another browser tab', () => {
    const product = {
      productId: 'custom-cross-tab',
      productName: 'CUSTOM CROSS TAB',
      familyId: 'manto-crudo',
      familyName: 'MANTO CRUDO',
      summaryGroupId: 'MANTO',
    }
    localStorage.setItem(TRABUNDA_STORAGE_KEYS.productCatalog, JSON.stringify([product]))

    reloadActiveProductCatalog()

    expect(getActiveProducts().some((item) => item.productId === product.productId)).toBe(true)
  })
})
