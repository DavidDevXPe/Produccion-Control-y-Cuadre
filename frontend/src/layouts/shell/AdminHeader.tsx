import { CalendarDays, type LucideIcon } from 'lucide-react'
import { UserIdentity } from '../../components/ui/UserIdentity'
import { WeekSelector, type WeekSelectorOption } from '../../components/ui/WeekSelector'
import { localUser } from '../../config/localUser'
import { ThemeToggle } from './ThemeToggle'
import type { ColorTheme } from './themeConfig'
import { shiftHours } from './navigationConfig'

export interface AdminHeaderProps {
  isDashboard: boolean
  operationalDate: string
  operationalWeekday: string
  operationalShift: 'Turno Día' | 'Turno Noche'
  ShiftIcon: LucideIcon
  weekSelectorOptions: readonly WeekSelectorOption[]
  activeWeekNumber: number
  onSelectWeek: (weekNumber: number) => void
  operationalPeriod: string
  colorTheme: ColorTheme
  onToggleTheme: () => void
}

export function AdminHeader({
  isDashboard,
  operationalDate,
  operationalWeekday,
  operationalShift,
  ShiftIcon,
  weekSelectorOptions,
  activeWeekNumber,
  onSelectWeek,
  operationalPeriod,
  colorTheme,
  onToggleTheme,
}: AdminHeaderProps) {
  return (
    <header
      className={`${
        isDashboard ? 'dashboard-topbar' : 'theme-surface-translucent'
      } relative z-20 hidden h-16 items-center justify-between border-b border-slate-200 bg-white px-7 xl:flex 2xl:px-8`}
    >
      <div>
        <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-brand-800">
          TRABUNDA Producción
        </p>
        <p className="mt-0.5 text-xs font-medium text-slate-500">
          Control y cuadre operativo
        </p>
      </div>
      <div className="flex h-full items-center text-xs text-slate-600">
        <div className="flex h-12 items-center gap-2.5 border-r border-slate-200 px-4">
          <CalendarDays className="size-5 text-brand-700" aria-hidden="true" />
          <span className="flex flex-col leading-tight">
            <span className="number-tabular font-bold text-slate-900">{operationalDate}</span>
            <span className="text-[0.6875rem] font-medium text-slate-500">{operationalWeekday}</span>
          </span>
        </div>
        <div className="flex h-12 items-center gap-2.5 border-r border-slate-200 px-4">
          <ShiftIcon className="size-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <span className="flex flex-col leading-tight">
            <span className="font-bold text-slate-900">{operationalShift}</span>
            <span className="number-tabular text-[0.6875rem] font-medium text-slate-500">
              {shiftHours[operationalShift]}
            </span>
          </span>
        </div>
        <div className="flex h-12 flex-col justify-center border-r border-slate-200 px-4">
          <WeekSelector
            options={weekSelectorOptions}
            selectedWeekNumber={activeWeekNumber}
            onChange={onSelectWeek}
          />
          <p className="number-tabular mt-0.5 w-full text-center text-[0.625rem] font-semibold tracking-[0.04em] text-slate-500 dark:text-slate-500">
            {operationalPeriod}
          </p>
        </div>
        <div className="flex h-12 items-center border-r border-slate-200 px-3">
          <ThemeToggle theme={colorTheme} onToggle={onToggleTheme} />
        </div>
        <UserIdentity user={localUser} className="h-12 pl-4" />
      </div>
    </header>
  )
}
