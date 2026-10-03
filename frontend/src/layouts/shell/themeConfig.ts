export type ColorTheme = 'light' | 'dark'

export function getInitialColorTheme(): ColorTheme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}
