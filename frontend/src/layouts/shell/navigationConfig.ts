import {
  Activity,
  BarChart3,
  CalendarDays,
  Database,
  History,
  LayoutDashboard,
  PackageOpen,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export const limaWeekdayFormatter = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long',
  timeZone: 'America/Lima',
})

export function formatLimaWeekday(date: Date): string {
  const weekday = limaWeekdayFormatter.format(date)
  return weekday.charAt(0).toUpperCase() + weekday.slice(1)
}

/** Shift hours confirmed by the business: Día 07:00–19:00, Noche 19:00–07:00. */
export const shiftHours = {
  'Turno Día': '07:00 – 19:00',
  'Turno Noche': '19:00 – 07:00',
} as const

export const industrialBackgroundUrl = `${import.meta.env.BASE_URL}brand/trabunda-industrial-bg.png`

export type NavigationItem = {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export type UpcomingNavigationItem = {
  label: string
  icon: LucideIcon
}

export const primaryNavigation: readonly NavigationItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
  { label: 'Jornadas', to: '/jornadas', icon: CalendarDays },
  { label: 'Saldos', to: '/saldos', icon: PackageOpen },
  { label: 'Rendimiento', to: '/rendimiento', icon: Activity },
  { label: 'Resumen', to: '/resumen', icon: BarChart3 },
]

export const administrationNavigation: readonly NavigationItem[] = [
  { label: 'Datos', to: '/datos', icon: Database },
  { label: 'Catálogos', to: '/catalogos', icon: Settings },
]

export const upcomingNavigation: readonly UpcomingNavigationItem[] = [
  { label: 'Auditoría', icon: History },
]

export const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'group flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors dark:border-l-[3px]',
    isActive
      ? 'bg-brand-700 text-white shadow-sm dark:border-ui-accent-dark dark:bg-ui-active-dark dark:text-white dark:[&>svg]:text-white'
      : 'text-slate-300 hover:bg-white/6 hover:text-white dark:border-transparent dark:text-ui-text-dark-muted dark:[&>svg]:text-ui-text-subtle dark:hover:bg-ui-surface-dark-hover dark:hover:text-ui-text-dark dark:hover:[&>svg]:text-ui-text-faint',
  ].join(' ')

export function getSectionLabel(pathname: string) {
  const activeItem = primaryNavigation.find((item) =>
    item.end ? pathname === item.to : pathname.startsWith(item.to),
  )

  return activeItem?.label ?? 'Control de producción'
}
