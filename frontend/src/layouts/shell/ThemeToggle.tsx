import { Moon, Sun } from 'lucide-react'
import type { ColorTheme } from './themeConfig'

export interface ThemeToggleProps {
  theme: ColorTheme
  onToggle: () => void
  className?: string
}

export function ThemeToggle({ theme, onToggle, className = '' }: ThemeToggleProps) {
  const isDark = theme === 'dark'
  const nextThemeLabel = isDark ? 'claro' : 'oscuro'

  return (
    <button
      type="button"
      className={`grid size-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 dark:hover:border-slate-300 dark:hover:bg-slate-100 dark:hover:text-slate-900 ${className}`}
      aria-label={`Cambiar a tema ${nextThemeLabel}`}
      aria-pressed={isDark}
      title={`Cambiar a tema ${nextThemeLabel}`}
      onClick={onToggle}
    >
      {isDark ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </button>
  )
}
