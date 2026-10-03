import { NavLink } from 'react-router-dom'
import { BrandLogo } from '../../components/ui/BrandLogo'
import {
  administrationNavigation,
  navLinkClassName,
  primaryNavigation,
  upcomingNavigation,
} from './navigationConfig'

export interface AdminSidebarContentProps {
  onNavigate?: () => void
}

export function AdminSidebarContent({ onNavigate }: AdminSidebarContentProps) {
  return (
    <div data-theme-sidebar className="flex h-full flex-col bg-brand-950 text-white dark:bg-ui-surface-dark-canvas dark:text-ui-text-dark">
      <div className="flex h-16 items-center justify-center border-b border-white/10 px-4">
        <NavLink
          to="/"
          className="flex w-full items-center justify-center rounded-lg transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
          aria-label="Ir al inicio"
        >
          <BrandLogo tone="dark" variant="seamless" />
        </NavLink>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5">
        <nav aria-label="Navegación principal">
          <p className="mb-2 px-3 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-ui-text-subtle">
            Operación
          </p>
          <ul className="space-y-1">
            {primaryNavigation.map((item) => {
              const Icon = item.icon

              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end ?? false}
                    className={navLinkClassName}
                    onClick={() => onNavigate?.()}
                  >
                    <Icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <nav className="mt-7" aria-label="Módulos próximos">
          <p className="mb-2 px-3 text-[0.625rem] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-ui-text-subtle">
            Administración
          </p>
          <ul className="space-y-1">
            {administrationNavigation.map((item) => {
              const Icon = item.icon

              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={navLinkClassName}
                    onClick={() => onNavigate?.()}
                  >
                    <Icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              )
            })}
            {upcomingNavigation.map((item) => {
              const Icon = item.icon

              return (
                <li key={item.label}>
                  <button
                    type="button"
                    disabled
                    className="flex min-h-10 w-full cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 dark:border-l-[3px] dark:border-transparent dark:text-ui-text-dark-dim"
                    title="Disponible próximamente"
                  >
                    <Icon className="size-[1.125rem] shrink-0" aria-hidden="true" />
                    <span className="flex-1">{item.label}</span>
                    <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-slate-500 dark:border-ui-line-dark-soft dark:text-ui-text-subtle">
                      Próximamente
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      <div className="h-[var(--sidebar-footer-height)] shrink-0 border-t border-white/10 px-5 py-3.5">
        <p className="text-[0.6875rem] font-semibold text-slate-400 dark:text-ui-text-faint">
          Control y Cuadre Operativo
        </p>
        <p className="mt-0.5 text-[0.625rem] leading-4 text-slate-400 dark:text-ui-text-subtle">
          Sistema interno de planta
        </p>
      </div>
    </div>
  )
}
