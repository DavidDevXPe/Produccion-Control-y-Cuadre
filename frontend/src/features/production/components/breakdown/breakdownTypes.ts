import { formatCentiKg } from '../../../../utils/formatters'
import type { Kg100, ProductReconciliation } from '../../model/types'

export interface ProductGroup {
  readonly familyId: string
  readonly familyName: string
  readonly products: readonly ProductReconciliation[]
}

export function sumField(
  products: readonly ProductReconciliation[],
  selector: (product: ProductReconciliation) => number,
): Kg100 {
  return products.reduce((total, product) => total + selector(product), 0) as Kg100
}

export function formatTunnelMovement(value: Kg100): string {
  return value === 0 ? '—' : formatCentiKg(value)
}
