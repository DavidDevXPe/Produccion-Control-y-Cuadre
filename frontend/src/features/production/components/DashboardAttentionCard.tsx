import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatIsoDateCompact } from '../../../utils/formatters'
import type {
  AttentionProcess,
  AttentionTone,
  DashboardAttentionItem,
  DashboardAttentionSummary,
} from '../presentation/dashboardAttention'

function processLabel(process: AttentionProcess | null) {
  if (process === null) return 'Envasado → Congelamiento'
  return process === 'FREEZING' ? 'Congelamiento' : 'Envasado'
}

const attentionToneStyles: Record<
  AttentionTone,
  { Icon: LucideIcon; iconClass: string; rowClass: string }
> = {
  danger: {
    Icon: XCircle,
    iconClass: 'bg-rose-600 text-white',
    rowClass: 'bg-rose-50/80 dark:bg-rose-500/10',
  },
  warning: {
    Icon: AlertTriangle,
    iconClass: 'bg-amber-500 text-slate-950',
    rowClass: '',
  },
  info: {
    Icon: Info,
    iconClass: 'bg-sky-600 text-white',
    rowClass: '',
  },
}

export interface DashboardAttentionCardProps {
  attentionItems: readonly DashboardAttentionItem[]
  attention: DashboardAttentionSummary
}

export function DashboardAttentionCard({
  attentionItems,
  attention,
}: DashboardAttentionCardProps) {
  return (
    <SectionCard
      title="Alertas y excepciones"
      description="Primero lo crítico, luego las observaciones de la semana."
      className={`xl:flex xl:flex-col xl:flex-1 xl:min-h-0 ${
        attention.criticalCount > 0
          ? 'border-rose-300/80 ring-1 ring-rose-200/60 dark:border-rose-500/40 dark:ring-rose-500/20'
          : ''
      }`}
      contentClassName="xl:flex xl:flex-col xl:flex-1 xl:min-h-0"
      action={
        <StatusBadge
          tone={
            attention.criticalCount > 0
              ? 'danger'
              : attentionItems.length > 0
                ? 'warning'
                : 'success'
          }
          truncateText={false}
        >
          {attention.criticalCount > 0
            ? `${attention.criticalCount} CRÍTICA${
                attention.criticalCount === 1 ? '' : 'S'
              }`
            : attentionItems.length > 0
              ? attentionItems.length === 1
                ? '1 OBSERVACIÓN'
                : `${attentionItems.length} OBSERVACIONES`
              : 'SIN ALERTAS'}
        </StatusBadge>
      }
    >
      {attentionItems.length > 0 ? (
        <div className="xl:flex xl:flex-col xl:flex-1 xl:min-h-0">
          <ul className="divide-y divide-slate-100 xl:flex-1 xl:min-h-0 xl:overflow-y-auto scrollbar-subtle pr-1">
            {attention.visible.map((item) => {
              const { Icon, iconClass, rowClass } =
                attentionToneStyles[item.tone]
              const isCritical = item.tone === 'danger'

              return (
                <li
                  key={item.key}
                  className={`flex items-start gap-3 px-4 py-3 ${rowClass}`}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-lg ${iconClass}`}
                    aria-hidden="true"
                  >
                    <Icon className="size-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-xs font-bold ${
                          isCritical
                            ? 'text-rose-950 dark:text-rose-100'
                            : 'text-slate-950'
                        }`}
                      >
                        {item.title}
                      </p>
                      <span className="number-tabular shrink-0 text-[0.625rem] font-semibold text-slate-500">
                        {formatIsoDateCompact(item.date)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[0.625rem] font-bold uppercase tracking-[0.05em] text-slate-500">
                      {processLabel(item.process)}
                    </p>
                    <p
                      className={`mt-0.5 line-clamp-2 text-xs leading-5 ${
                        isCritical
                          ? 'text-rose-900/80 dark:text-rose-100/80'
                          : 'text-slate-600'
                      }`}
                    >
                      {item.description}
                    </p>
                    <ActionLink
                      to={
                        item.to ??
                        `/jornadas/${item.date}?process=${item.process}`
                      }
                      variant="ghost"
                      size="sm"
                      aria-label={`Revisar: ${item.title}`}
                      className="-ml-3 mt-0.5"
                    >
                      Revisar
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </ActionLink>
                  </div>
                </li>
              )
            })}
          </ul>

          {attention.hiddenCount > 0 ? (
            <div className="flex flex-col gap-1 border-t border-slate-100 bg-slate-50 px-4 py-2 shrink-0 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-semibold text-slate-600">
                Hay {attention.hiddenCount}{' '}
                {attention.hiddenCount === 1
                  ? 'evento adicional'
                  : 'eventos adicionales'}{' '}
                de la semana.
              </p>
              <ActionLink to="/jornadas" variant="ghost" size="sm">
                Ver todas
                <ArrowRight className="size-4" aria-hidden="true" />
              </ActionLink>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center gap-3 px-5 py-6 text-sm text-slate-500">
          <CheckCircle2
            className="size-5 shrink-0 text-emerald-600"
            aria-hidden="true"
          />
          No hay observaciones ni validaciones bloqueantes detectadas.
        </div>
      )}
    </SectionCard>
  )
}
