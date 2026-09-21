export function repairProductMojibake(value: string): string {
  return value
    .replace(/ESPAÃƒâ€˜A/gi, 'ESPAÑA')
    .replace(/ESPAÃ‘A/gi, 'ESPAÑA')
    .replace(/JAPONÃƒâ€°S/gi, 'JAPONÉS')
    .replace(/JAPONÃ‰S/gi, 'JAPONÉS')
    .replace(/JAPONÃ‰/gi, 'JAPONÉ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeProductName(value: string): string {
  return repairProductMojibake(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bP\.N\.?\b/gi, 'PN')
    .replace(/\bS\/TTO\.?\b/gi, 'STTO')
    .replace(/\s*-\s*/g, '-')
    .replace(/[^A-Z0-9-]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleUpperCase('es-PE')
}

export function productNameSlug(value: string): string {
  return normalizeProductName(value).toLocaleLowerCase('es-PE').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
