import { ArrowRight } from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { SectionCard } from '../../../components/ui/SectionCard'

const COVERAGE_DAYS = 7

interface CoverageRowProps {
  label: string
  value: number
}

function CoverageRow({ label, value }: CoverageRowProps) {
  const percent = Math.min(100, Math.max(0, (value / COVERAGE_DAYS) * 100))

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-800">{label}</span>
        <span className="number-tabular font-bold text-slate-900">
          {value} / {COVERAGE_DAYS}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`Cobertura de ${label}`}
        aria-valuemin={0}
        aria-valuemax={COVERAGE_DAYS}
        aria-valuenow={value}
        aria-valuetext={`${value} de ${COVERAGE_DAYS} jornadas`}
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className={`h-full rounded-full ${
            value === COVERAGE_DAYS ? 'bg-emerald-500' : 'bg-sky-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

interface StatusCounterProps {
  label: string
  value: number
  tone: 'success' | 'warning' | 'danger'
  hint?: string
}

const statusCounterClasses: Record<
  StatusCounterProps['tone'],
  { box: string; value: string }
> = {
  success: {
    box: 'border-emerald-300 bg-emerald-50 dark:border-emerald-400/50 dark:bg-emerald-500/10',
    value: 'text-emerald-700 dark:text-emerald-300',
  },
  warning: {
    box: 'border-amber-300 bg-amber-50 dark:border-amber-400/50 dark:bg-amber-500/10',
    value: 'text-amber-800 dark:text-amber-300',
  },
  danger: {
    box: 'border-rose-300 bg-rose-50 dark:border-rose-400/50 dark:bg-rose-500/10',
    value: 'text-rose-700 dark:text-rose-300',
  },
}

function StatusCounter({ label, value, tone, hint }: StatusCounterProps) {
  return (
    <div
      className={`rounded-lg border px-2 py-2 text-center ${statusCounterClasses[tone].box}`}
    >
      <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-700">
        {label}
      </dt>
      <dd
        className={`number-tabular mt-0.5 text-2xl font-extrabold ${statusCounterClasses[tone].value}`}
      >
        {value}
      </dd>
      {hint ? (
        <p className="mt-0.5 text-[0.625rem] leading-4 text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

export interface DashboardJourneyStatusCardProps {
  packingDaysCount: number
  freezingDaysCount: number
  balancedJourneyCount: number
  observedJourneyCount: number
  reviewJourneyCount: number
  notBalancedJourneyCount: number
  registeredJourneyCount: number
  registeredOperationalDayCount: number
}

export function DashboardJourneyStatusCard({
  packingDaysCount,
  freezingDaysCount,
  balancedJourneyCount,
  observedJourneyCount,
  reviewJourneyCount,
  notBalancedJourneyCount,
  registeredJourneyCount,
  registeredOperationalDayCount,
}: DashboardJourneyStatusCardProps) {
  return (
    <SectionCard
      title="Estado de jornadas"
      description={`${registeredJourneyCount} jornadas en ${registeredOperationalDayCount} de ${COVERAGE_DAYS} días.`}
      action={
        <ActionLink to="/jornadas" variant="ghost" size="sm">
          Ver jornadas
          <ArrowRight className="size-4" aria-hidden="true" />
        </ActionLink>
      }
      contentClassName="space-y-3 p-4 shrink-0"
    >
      <div className="space-y-3">
        <CoverageRow label="Envasado" value={packingDaysCount} />
        <CoverageRow label="Congelamiento" value={freezingDaysCount} />
      </div>

      <dl className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-3">
        <StatusCounter
          label="Cuadradas"
          value={balancedJourneyCount}
          tone="success"
          hint="Sin observaciones"
        />
        <StatusCounter
          label="Con observación"
          value={observedJourneyCount}
          tone="warning"
          hint="Cuadradas con nota"
        />
        <StatusCounter
          label="Por revisar"
          value={reviewJourneyCount}
          tone={notBalancedJourneyCount > 0 ? 'danger' : 'warning'}
          hint="Pendientes o no cuadradas"
        />
      </dl>

      <p className="border-t border-slate-100 pt-2 text-[0.6875rem] leading-5 text-slate-500">
        Los tres grupos son excluyentes y suman las{' '}
        <span className="font-semibold text-slate-700">
          {registeredJourneyCount} jornadas
        </span>{' '}
        de la semana (Envasado + Congelamiento).
      </p>
    </SectionCard>
  )
}

