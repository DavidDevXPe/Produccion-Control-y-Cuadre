/**
 * Sanitiza valores numéricos de cantidad en kg:
 * - Acepta tanto ',' como '.' y lo normaliza a '.'
 * - Permite cadena vacía
 * - Permite solo dígitos y como máximo un punto decimal con hasta 2 decimales
 * - Rechaza letras, signos negativos y decimales extras (>2)
 */
export function sanitizeQuantityValue(rawValue: string): string | null {
  const normalized = rawValue.replace(",", ".");
  if (normalized === "") {
    return "";
  }
  const regex = /^\d*(\.\d{0,2})?$/;
  if (regex.test(normalized)) {
    return normalized;
  }
  return null;
}
