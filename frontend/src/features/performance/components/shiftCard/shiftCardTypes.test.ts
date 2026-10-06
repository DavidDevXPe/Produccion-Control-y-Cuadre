import { describe, expect, it } from 'vitest'
import {
  benchmarkStatusLabels,
  formatMetric,
  parseNonNegative,
} from './shiftCardTypes'

describe('shiftCardTypes', () => {
  describe('formatMetric', () => {
    it('returns fallback dash when value is null or not finite', () => {
      expect(formatMetric(null)).toBe('—')
      expect(formatMetric(Number.NaN)).toBe('—')
      expect(formatMetric(Number.POSITIVE_INFINITY)).toBe('—')
      expect(formatMetric(Number.NEGATIVE_INFINITY)).toBe('—')
    })

    it('formats numbers with 2 decimal places in es-PE locale without suffix', () => {
      expect(formatMetric(0)).toBe('0.00')
      expect(formatMetric(1234.5)).toBe('1,234.50')
      expect(formatMetric(42.126)).toBe('42.13')
    })

    it('appends the given suffix when provided', () => {
      expect(formatMetric(10.5, ' h')).toBe('10.50 h')
      expect(formatMetric(98.2, '%')).toBe('98.20%')
    })
  })

  describe('parseNonNegative', () => {
    it('parses valid positive numbers and integers', () => {
      expect(parseNonNegative('10')).toBe(10)
      expect(parseNonNegative('0')).toBe(0)
      expect(parseNonNegative('12.75')).toBe(12.75)
    })

    it('normalizes commas to dots for decimal notation', () => {
      expect(parseNonNegative('14,5')).toBe(14.5)
      expect(parseNonNegative('0,25')).toBe(0.25)
    })

    it('returns 0 for negative numbers', () => {
      expect(parseNonNegative('-5')).toBe(0)
      expect(parseNonNegative('-0.5')).toBe(0)
    })

    it('returns 0 for invalid or non-numeric strings', () => {
      expect(parseNonNegative('')).toBe(0)
      expect(parseNonNegative('abc')).toBe(0)
      expect(parseNonNegative('undefined')).toBe(0)
    })
  })

  describe('benchmarkStatusLabels', () => {
    it('maps all benchmark statuses to their expected Spanish labels', () => {
      expect(benchmarkStatusLabels.NOT_CONFIGURED).toBe('NO CONFIGURADO')
      expect(benchmarkStatusLabels.BELOW_TARGET).toBe('BAJO OBJETIVO')
      expect(benchmarkStatusLabels.NEAR_TARGET).toBe('CERCA DEL OBJETIVO')
      expect(benchmarkStatusLabels.AT_OR_ABOVE_TARGET).toBe('OBJETIVO / SOBRE OBJETIVO')
    })
  })
})
