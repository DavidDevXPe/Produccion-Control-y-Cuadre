import type {
  ClosureMessage,
  ProductionClosureValidation,
} from './businessRules'

export type ClosureReviewSeverity = 'BLOCKER' | 'WARNING'

export interface ClosureReviewItem {
  readonly id: string
  readonly severity: ClosureReviewSeverity
  readonly message: string
}

interface BuildClosureReviewItemsOptions {
  readonly pendingClosureReasons: readonly string[]
  readonly closureValidation: ProductionClosureValidation
  readonly diagnostics: readonly ClosureMessage[]
}

/**
 * Builds the single review list used by the footer and the inline panel.
 * Messages are deduplicated by their visible text so a blocker already
 * surfaced by a shift diagnostic is not counted twice.
 */
export function buildClosureReviewItems({
  pendingClosureReasons,
  closureValidation,
  diagnostics,
}: BuildClosureReviewItemsOptions): readonly ClosureReviewItem[] {
  const items: ClosureReviewItem[] = []
  const byMessage = new Map<string, number>()

  const add = (
    severity: ClosureReviewSeverity,
    message: string,
    source: string,
  ) => {
    const normalizedMessage = message.trim()
    if (!normalizedMessage) return

    const existingIndex = byMessage.get(normalizedMessage)
    if (existingIndex !== undefined) {
      const existing = items[existingIndex]!
      if (existing.severity === 'WARNING' && severity === 'BLOCKER') {
        items[existingIndex] = { ...existing, severity }
      }
      return
    }

    byMessage.set(normalizedMessage, items.length)
    items.push({
      id: `${severity.toLowerCase()}:${source}:${normalizedMessage}`,
      severity,
      message: normalizedMessage,
    })
  }

  for (const message of pendingClosureReasons) {
    add('BLOCKER', message, 'pending')
  }

  for (const blocker of closureValidation.blockers) {
    add('BLOCKER', blocker.message, `validation:${blocker.code}`)
  }

  for (const diagnostic of diagnostics) {
    if (diagnostic.code === 'SHIFT_BALANCED') continue
    add('BLOCKER', diagnostic.message, `diagnostic:${diagnostic.code}`)
  }

  for (const warning of closureValidation.warnings) {
    add(
      'WARNING',
      warning.message,
      `warning:${warning.code}${warning.productId ? `:${warning.productId}` : ''}`,
    )
  }

  return items
}
