import { Menu } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { BrandLogo } from '../../components/ui/BrandLogo'
import { UserIdentity } from '../../components/ui/UserIdentity'
import { WeekSelector, type WeekSelectorOption } from '../../components/ui/WeekSelector'
import { localUser } from '../../config/localUser'
import { ThemeToggle } from './ThemeToggle'
import type { ColorTheme } from './themeConfig'

export interface AdminMobileHeaderProps {
  isMenuOpen: boolean
  onOpenMenu: () => void
  sectionLabel: string
  weekSelectorOptions: readonly WeekSelectorOption[]
  activeWeekNumber: number
  onSelectWeek: (weekNumber: number) => void
  colorTheme: ColorTheme
  onToggleTheme: () => void
}

export function AdminMobileHeader({
  isMenuOpen,
  onOpenMenu,
  sectionLabel,
  weekSelectorOptions,
  activeWeekNumber,
  onSelectWeek,
  colorTheme,
  onToggleTheme,
}: AdminMobileHeaderProps) {
  return (
    <header className="theme-surface-translucent sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur xl:hidden">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-50"
          aria-label="Abrir menú de navegación"
          aria-controls="mobile-navigation"
          aria-expanded={isMenuOpen}
          onClick={onOpenMenu}
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
        <NavLink to="/" aria-label="Ir al inicio" className="flex items-center">
          <BrandLogo tone="auto" variant="seamless" />
        </NavLink>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <p className="hidden min-w-0 truncate text-sm font-bold text-slate-900 sm:block">
          {sectionLabel}
        </p>
        <WeekSelector
          options={weekSelectorOptions}
          selectedWeekNumber={activeWeekNumber}
          onChange={onSelectWeek}
          compact
        />
        <ThemeToggle theme={colorTheme} onToggle={onToggleTheme} />
        <UserIdentity
          user={localUser}
          responsive
          className="hidden min-[380px]:flex"
        />
      </div>
    </header>
  )
}
