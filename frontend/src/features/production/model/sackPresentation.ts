export interface SackPresentation {
  readonly name: string
  readonly blockCount: number
  readonly kgPerBlock: number
  readonly totalKg: number
}

const SACO_PATTERN = /(?:^|\s-\s)SACO\s+(\d+)\s*(?:x|×|Ã—)\s*(\d+(?:[.,]\d+)?)\s*kg\s*$/i

function normalizePresentation(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toUpperCase()
}

/**
 * Reads the logistics presentation at the end of a product description.
 * The conversion is deliberately independent from the 10 kg aro/block rule
 * used by Envasado and Congelamiento.
 */
export function parseSackPresentation(
  productName: string,
  presentationName?: string,
): SackPresentation | null {
  const source = normalizePresentation(presentationName ?? productName)
  const match = SACO_PATTERN.exec(source)

  if (!match) return null

  const blockCount = Number(match[1])
  const kgPerBlock = Number((match[2] ?? '').replace(',', '.'))

  if (
    !Number.isInteger(blockCount) ||
    blockCount <= 0 ||
    !Number.isFinite(kgPerBlock) ||
    kgPerBlock <= 0
  ) {
    return null
  }

  return {
    name: `SACO ${blockCount} x ${kgPerBlock} kg`,
    blockCount,
    kgPerBlock,
    totalKg: blockCount * kgPerBlock,
  }
}

/**
 * Existing jornadas may have been created before the presentation was
 * captured. Their historical calculations used 20 kg per sack, so that
 * fallback remains only for legacy rows without an explicit presentation.
 */
export function getSackWeightKg(
  productName: string,
  presentationName?: string,
  explicitSackKg?: number,
): number {
  if (explicitSackKg !== undefined && explicitSackKg > 0) {
    return explicitSackKg
  }

  return parseSackPresentation(productName, presentationName)?.totalKg ?? 20
}

export function roundSackCount(kg: number, sackWeightKg: number): number {
  if (!Number.isFinite(kg) || kg <= 0 || sackWeightKg <= 0) return 0
  return Math.round((kg / sackWeightKg) * 10) / 10
}
