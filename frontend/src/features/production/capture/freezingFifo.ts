import { kg100 } from "../model/calculations";
import type { FreezingAvailabilityPosition } from "../model/freezing";
import { productIdsEquivalent } from "../model/productIdentity";
import type { Kg100 } from "../model/types";
import type { ProductionCatalogItem } from "./productionCatalog";
import type { ProductionCaptureBalanceUse } from "./productionCapture";
import { normalizeProductName } from "./productNormalizer";

interface BuildFreezingFifoAllocationArgs {
  targetProduct: Pick<
    ProductionCatalogItem,
    "productId" | "productName" | "familyId" | "familyName"
  >;
  reportedDayKg100: Kg100;
  reportedNightKg100: Kg100;
  positions: readonly FreezingAvailabilityPosition[];
  existingUses: readonly ProductionCaptureBalanceUse[];
}

export interface FreezingFifoAllocationResult {
  balanceUses: readonly ProductionCaptureBalanceUse[];
  allocatedKg100: Kg100;
  remainingDayKg100: Kg100;
  remainingNightKg100: Kg100;
}

function captureValueToKg100(value: string): Kg100 {
  const parsed = Number(value.trim().replace(",", "."));

  return Number.isFinite(parsed) && parsed >= 0
    ? kg100(Math.round(parsed * 100))
    : kg100(0);
}

function kg100ToCaptureValue(value: Kg100): string {
  return String(Number((value / 100).toFixed(2)));
}

/**
 * Identidad lógica de un saldo utilizado por Congelamiento.
 *
 * Una misma combinación de:
 * - jornada origen,
 * - familia destino,
 * - producto destino,
 * - producto fuente,
 *
 * representa un único vínculo operativo.
 */
function balanceUseIdentity(use: ProductionCaptureBalanceUse): string {
  return [
    use.originDayId,
    use.familyId,
    use.productId,
    use.sourceProductId ?? use.productId,
  ].join("|");
}

/**
 * Normaliza vínculos de saldo duplicados.
 *
 * IMPORTANTE:
 * Si el mismo vínculo aparece dos veces por un error histórico,
 * NO se suman los kg, porque eso duplicaría artificialmente el
 * consumo. Se conserva el mayor valor registrado por turno.
 *
 * Esto permite que FIFO sea idempotente:
 * ejecutar la vinculación más de una vez no debe crear nuevos
 * registros para el mismo origen/producto.
 */
function normalizeBalanceUses(
  uses: readonly ProductionCaptureBalanceUse[],
): ProductionCaptureBalanceUse[] {
  const usesByIdentity = new Map<string, ProductionCaptureBalanceUse>();

  for (const use of uses) {
    const identity = balanceUseIdentity(use);
    const existing = usesByIdentity.get(identity);

    if (!existing) {
      usesByIdentity.set(identity, { ...use });
      continue;
    }

    const existingDayKg100 = captureValueToKg100(existing.dayKg);
    const incomingDayKg100 = captureValueToKg100(use.dayKg);

    const existingNightKg100 = captureValueToKg100(existing.nightKg);
    const incomingNightKg100 = captureValueToKg100(use.nightKg);

    const sourceProductId = existing.sourceProductId ?? use.sourceProductId;

    usesByIdentity.set(identity, {
      ...existing,

      availableKg100: kg100(
        Math.max(existing.availableKg100, use.availableKg100),
      ),

      dayKg: kg100ToCaptureValue(
        kg100(Math.max(existingDayKg100, incomingDayKg100)),
      ),

      nightKg: kg100ToCaptureValue(
        kg100(Math.max(existingNightKg100, incomingNightKg100)),
      ),

      ...(sourceProductId ? { sourceProductId } : {}),

      requiresProductDistribution:
        existing.requiresProductDistribution === true ||
        use.requiresProductDistribution === true,
    });
  }

  return [...usesByIdentity.values()];
}

function matchesTargetProduct(
  position: FreezingAvailabilityPosition,
  product: BuildFreezingFifoAllocationArgs["targetProduct"],
): boolean {
  if (position.pendingKg100 <= 0) return false;
  if (position.familyId !== product.familyId) return false;

  if (productIdsEquivalent(position.productId, product.productId)) {
    return true;
  }

  return (
    normalizeProductName(position.productName) ===
    normalizeProductName(product.productName)
  );
}

export function buildFreezingFifoAllocation({
  targetProduct,
  reportedDayKg100,
  reportedNightKg100,
  positions,
  existingUses,
}: BuildFreezingFifoAllocationArgs): FreezingFifoAllocationResult {
  /*
   * Antes de calcular cualquier asignación FIFO limpiamos vínculos
   * duplicados que puedan venir de borradores históricos o de una
   * versión anterior de la aplicación.
   */
  const normalizedExistingUses = normalizeBalanceUses(existingUses);

  const productUses = normalizedExistingUses.filter(
    (use) =>
      use.productId === targetProduct.productId &&
      use.requiresProductDistribution !== true,
  );

  const alreadyLinkedDayKg100 = kg100(
    productUses.reduce(
      (total, use) => total + captureValueToKg100(use.dayKg),
      0,
    ),
  );

  const alreadyLinkedNightKg100 = kg100(
    productUses.reduce(
      (total, use) => total + captureValueToKg100(use.nightKg),
      0,
    ),
  );

  const initialRemainingDayKg100 = kg100(
    Math.max(reportedDayKg100 - alreadyLinkedDayKg100, 0),
  );

  const initialRemainingNightKg100 = kg100(
    Math.max(reportedNightKg100 - alreadyLinkedNightKg100, 0),
  );

  let remainingDayKg100 = initialRemainingDayKg100;
  let remainingNightKg100 = initialRemainingNightKg100;

  const updatedExistingUses = new Map<string, ProductionCaptureBalanceUse>();
  const newUses: ProductionCaptureBalanceUse[] = [];

  const matchingPositions = [...positions]
    .filter((position) => matchesTargetProduct(position, targetProduct))
    .sort((first, second) => {
      const dateComparison = first.originDate.localeCompare(second.originDate);

      if (dateComparison !== 0) {
        return dateComparison;
      }

      const dayComparison = first.originDayId.localeCompare(second.originDayId);

      if (dayComparison !== 0) {
        return dayComparison;
      }

      return first.productId.localeCompare(second.productId);
    });

  for (const position of matchingPositions) {
    if (remainingDayKg100 === 0 && remainingNightKg100 === 0) {
      break;
    }

    /*
     * Buscamos el vínculo ya normalizado. Así evitamos trabajar
     * sobre una segunda copia duplicada del mismo origen.
     */
    const existingUse = normalizedExistingUses.find(
      (use) =>
        use.productId === targetProduct.productId &&
        use.originDayId === position.originDayId &&
        productIdsEquivalent(
          use.sourceProductId ?? use.productId,
          position.productId,
        ),
    );

    const currentDayKg100 = existingUse
      ? captureValueToKg100(existingUse.dayKg)
      : kg100(0);

    const currentNightKg100 = existingUse
      ? captureValueToKg100(existingUse.nightKg)
      : kg100(0);

    /*
     * También calculamos el consumo previo desde la colección
     * normalizada. Si había dos copias del mismo vínculo, ya no
     * se contabilizan dos veces.
     */
    const alreadyConsumedFromPositionKg100 = kg100(
      normalizedExistingUses
        .filter(
          (use) =>
            use.originDayId === position.originDayId &&
            productIdsEquivalent(
              use.sourceProductId ?? use.productId,
              position.productId,
            ),
        )
        .reduce(
          (total, use) =>
            total +
            captureValueToKg100(use.dayKg) +
            captureValueToKg100(use.nightKg),
          0,
        ),
    );

    const availableKg100 = position.pendingKg100;

    let capacityKg100 = kg100(
      Math.max(availableKg100 - alreadyConsumedFromPositionKg100, 0),
    );

    if (capacityKg100 === 0) {
      continue;
    }

    /*
     * FIFO llena primero Turno Día y después Turno Noche,
     * respetando siempre la capacidad real pendiente del origen.
     */
    const dayAllocationKg100 = kg100(
      Math.min(remainingDayKg100, capacityKg100),
    );

    remainingDayKg100 = kg100(remainingDayKg100 - dayAllocationKg100);

    capacityKg100 = kg100(capacityKg100 - dayAllocationKg100);

    const nightAllocationKg100 = kg100(
      Math.min(remainingNightKg100, capacityKg100),
    );

    remainingNightKg100 = kg100(remainingNightKg100 - nightAllocationKg100);

    if (dayAllocationKg100 === 0 && nightAllocationKg100 === 0) {
      continue;
    }

    if (existingUse) {
      updatedExistingUses.set(existingUse.key, {
        ...existingUse,
        availableKg100,
        dayKg: kg100ToCaptureValue(kg100(currentDayKg100 + dayAllocationKg100)),
        nightKg: kg100ToCaptureValue(
          kg100(currentNightKg100 + nightAllocationKg100),
        ),
      });

      continue;
    }

    newUses.push({
      key: `balance-${position.originDayId}-${position.productId}`,
      originDayId: position.originDayId,
      originDate: position.originDate,
      familyId: targetProduct.familyId,
      familyName: targetProduct.familyName,
      productId: targetProduct.productId,
      productName: targetProduct.productName,
      availableKg100,
      dayKg: kg100ToCaptureValue(dayAllocationKg100),
      nightKg: kg100ToCaptureValue(nightAllocationKg100),
      ...(position.productId !== targetProduct.productId
        ? { sourceProductId: position.productId }
        : {}),
      requiresProductDistribution: false,
    });
  }

  /*
   * La salida vuelve a normalizarse para garantizar que:
   * - no queden dos vínculos con la misma identidad,
   * - un segundo clic en "Vincular FIFO" no genere duplicados,
   * - los datos históricos duplicados no se propaguen.
   */
  const balanceUses = normalizeBalanceUses([
    ...normalizedExistingUses.map(
      (use) => updatedExistingUses.get(use.key) ?? use,
    ),
    ...newUses,
  ]);

  const allocatedKg100 = kg100(
    initialRemainingDayKg100 +
      initialRemainingNightKg100 -
      remainingDayKg100 -
      remainingNightKg100,
  );

  return {
    balanceUses,
    allocatedKg100,
    remainingDayKg100,
    remainingNightKg100,
  };
}
