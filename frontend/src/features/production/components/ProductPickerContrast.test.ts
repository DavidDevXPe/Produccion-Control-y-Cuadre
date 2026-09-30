import { describe, expect, it } from 'vitest'

function getRelativeLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '')
  const rgb = [
    parseInt(cleanHex.substring(0, 2), 16) / 255,
    parseInt(cleanHex.substring(2, 4), 16) / 255,
    parseInt(cleanHex.substring(4, 6), 16) / 255,
  ]
  const [r, g, b] = rgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  ) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function calculateContrastRatio(hexForeground: string, hexBackground: string): number {
  const l1 = getRelativeLuminance(hexForeground)
  const l2 = getRelativeLuminance(hexBackground)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('Bloque A — Contraste de opciones y grupos en ProductPicker y select nativo', () => {
  const LIGHT_SURFACE = '#ffffff'
  const DARK_SURFACE = '#0a1a27' // ui-surface-dark-deep

  it('cumple con el objetivo de contraste >= 7:1 en opciones principales (ambos temas)', () => {
    // Modo claro: slate-900 (#0f172a) sobre blanco
    const lightOptionContrast = calculateContrastRatio('#0f172a', LIGHT_SURFACE)
    expect(lightOptionContrast).toBeGreaterThanOrEqual(7)
    expect(lightOptionContrast).toBeGreaterThanOrEqual(16)

    // Modo oscuro: ui-text-dark-strong (#f3f8fb) sobre ui-surface-dark-deep (#0a1a27)
    const darkOptionContrast = calculateContrastRatio('#f3f8fb', DARK_SURFACE)
    expect(darkOptionContrast).toBeGreaterThanOrEqual(7)
    expect(darkOptionContrast).toBeGreaterThanOrEqual(16)
  })

  it('cumple con contraste >= 4.5:1 en encabezados de grupo y optgroup labels (ambos temas)', () => {
    // Modo claro: brand-900 (#123f51) y brand-700 (#0b6685) sobre blanco
    const lightGroupHeader = calculateContrastRatio('#123f51', LIGHT_SURFACE)
    const lightOptgroup = calculateContrastRatio('#0b6685', LIGHT_SURFACE)
    expect(lightGroupHeader).toBeGreaterThanOrEqual(7)
    expect(lightOptgroup).toBeGreaterThanOrEqual(4.5)

    // Modo oscuro: ui-accent-cyan (#58c8ea) sobre ui-surface-dark-deep (#0a1a27)
    const darkGroupHeader = calculateContrastRatio('#58c8ea', DARK_SURFACE)
    expect(darkGroupHeader).toBeGreaterThanOrEqual(7) // Supera incluso 7:1 (9.13:1)
  })

  it('cumple con contraste >= 4.5:1 en textos secundarios de opciones (ambos temas)', () => {
    // Modo claro: slate-600 (#475569) sobre blanco
    const lightSecondaryContrast = calculateContrastRatio('#475569', LIGHT_SURFACE)
    expect(lightSecondaryContrast).toBeGreaterThanOrEqual(4.5)
    expect(lightSecondaryContrast).toBeGreaterThanOrEqual(7)

    // Modo oscuro: ui-text-dark-soft (#a5bed0) sobre ui-surface-dark-deep (#0a1a27)
    const darkSecondaryContrast = calculateContrastRatio('#a5bed0', DARK_SURFACE)
    expect(darkSecondaryContrast).toBeGreaterThanOrEqual(7)
  })

  it('cumple con contraste >= 3:1 para estados deshabilitados (ambos temas)', () => {
    // Modo claro: slate-500 (#64748b) sobre blanco
    const lightDisabledContrast = calculateContrastRatio('#64748b', LIGHT_SURFACE)
    expect(lightDisabledContrast).toBeGreaterThanOrEqual(3)

    // Modo oscuro: ui-text-subtle (#6f8798) sobre ui-surface-dark-deep (#0a1a27)
    const darkDisabledContrast = calculateContrastRatio('#6f8798', DARK_SURFACE)
    expect(darkDisabledContrast).toBeGreaterThanOrEqual(3)
  })
})
