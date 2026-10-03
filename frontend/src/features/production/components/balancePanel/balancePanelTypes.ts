import type { Kg100, ProductReconciliation } from "../../model/types";

export interface BalanceProductPosition {
  readonly productId: string;
  readonly processedDayKg100: Kg100;
  readonly processedNightKg100: Kg100;
  readonly pendingKg100: Kg100;
  /** Consumed above what the origin generated; shown, never netted away. */
  readonly excessKg100?: Kg100;
}

export interface BalanceFamilyGroup {
  readonly familyId: string;
  readonly familyName: string;
  readonly products: readonly ProductReconciliation[];
}

export const zeroKg100 = 0 as Kg100;

export const balanceTimelineHelp =
  "El saldo mostrado corresponde al cierre de esta jornada. Los consumos posteriores permiten conocer cuánto permanece pendiente actualmente.";

export function currentMvpPosition(
  product: ProductReconciliation,
): BalanceProductPosition {
  return {
    productId: product.productId,
    processedDayKg100: zeroKg100,
    processedNightKg100: zeroKg100,
    pendingKg100: product.newClosingBalanceKg100,
  };
}

export function sumBalances(
  products: readonly ProductReconciliation[],
  selector: (product: ProductReconciliation) => number,
): Kg100 {
  return products.reduce((sum, product) => sum + selector(product), 0) as Kg100;
}
