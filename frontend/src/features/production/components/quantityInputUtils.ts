/**
 * Sanitiza valores numéricos de cantidad en kg:
 * - Acepta tanto ',' como '.' y lo normaliza a '.'
 * - Maneja pegado con separadores de miles (ej. "12,031.50" o "12031,5" o "12,031")
 * - Permite cadena vacía
 * - Permite solo dígitos y como máximo un punto decimal con hasta 2 decimales
 * - Rechaza letras, signos negativos y decimales extras (>2)
 */
export function sanitizeQuantityValue(rawValue: string): string | null {
  const trimmed = rawValue.trim()
  if (trimmed === '') {
    return ''
  }

  let normalized = trimmed

  // Si contiene comas y puntos:
  if (normalized.includes(',') && normalized.includes('.')) {
    const lastComma = normalized.lastIndexOf(',')
    const lastDot = normalized.lastIndexOf('.')
    if (lastDot > lastComma) {
      // Formato estándar con comas de miles y punto decimal: "12,031.50"
      normalized = normalized.replace(/,/g, '')
    } else {
      // Formato con puntos de miles y coma decimal: "12.031,50"
      normalized = normalized.replace(/\./g, '').replace(',', '.')
    }
  } else if (normalized.includes(',')) {
    // Si contiene solo comas:
    // Verificar si es separador de miles: grupos de 3 dígitos (ej. "12,031" o "1,234,567")
    if (/^\d{1,3}(,\d{3})+$/.test(normalized)) {
      normalized = normalized.replace(/,/g, '')
    } else {
      // Es una coma decimal: "12031,5" -> "12031.5", "12,5" -> "12.5", "0,75" -> "0.75"
      normalized = normalized.replace(',', '.')
    }
  }

  const regex = /^\d*(\.\d{0,2})?$/
  if (regex.test(normalized)) {
    return normalized
  }
  return null
}

/**
 * Formatea una cantidad numérica en kg con separadores de miles para visualización (cuando no tiene foco).
 * Ejemplos:
 * - "12031" -> "12,031"
 * - "12031.5" -> "12,031.5"
 * - "12031.25" -> "12,031.25"
 * - "0" -> "0"
 * - "" -> ""
 */
export function formatQuantityWithThousands(value: string): string {
  const trimmed = value.trim()
  if (trimmed === '') {
    return ''
  }
  const [integerPart = '', decimalPart] = trimmed.split('.')
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return decimalPart !== undefined && decimalPart !== ''
    ? `${formattedInteger}.${decimalPart}`
    : formattedInteger
}
