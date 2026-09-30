import type { ComboboxOption } from './Combobox'

export function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function groupOptions(
  options: ComboboxOption[],
): { name: string; items: ComboboxOption[] }[] {
  const map = new Map<string, ComboboxOption[]>()
  for (const opt of options) {
    const groupName = opt.group ?? ''
    const list = map.get(groupName) ?? []
    list.push(opt)
    map.set(groupName, list)
  }
  return Array.from(map.entries()).map(([name, items]) => ({ name, items }))
}
