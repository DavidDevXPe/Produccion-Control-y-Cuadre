import { Link } from 'react-router-dom'
import { SectionCard } from '../../../components/ui/SectionCard'
import {
  StatusBadge,
  type StatusBadgeTone,
} from '../../../components/ui/StatusBadge'
import {
  formatCentiKg,
  formatIsoDate,
  formatIsoWeekday,
} from '../../../utils/formatters'
import type {
  FreezingOriginExplanation,
  FreezingOriginState,
} from '../presentation/freezingAvailabilityExplanation'

interface FreezingAvailabilityExplanationProps {
  origins: readonly FreezingOriginExplanation[]
}

const statePresentation: Record<
  FreezingOriginState,
  { label: string; tone: StatusBadgeTone }
> = {
  COMPLETE: { label: 'CONGELADO 100%', tone: 'success' },
  PENDING: { label: 'PENDIENTE DE CONGELAR', tone: 'warning' },
  EXCESS: { label: 'EXCESO · REVISAR', tone: 'danger' },
}

function Row({
  label,
  value,
  hint,
  emphasis = false,
}: {
  label: string
  value: string
  hint?: string
  emphasis?: boolean
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 py-1 ${
        emphasis ? 'font-bold text-slate-950' : 'text-slate-700'
      }`}
    >
      <dt className="min-w-0">
        {label}
        {hint ? (
          <span className="ml-1 text-[0.6875rem] font-normal text-slate-500">
            {hint}
          </span>
        ) : null}
      </dt>
      <dd className="number-tabular shrink-0 font-semibold">{value}</dd>
    </div>
  )
}

function OriginCard({ origin }: { origin: FreezingOriginExplanation }) {
  const state = statePresentation[origin.state]

  return (
    <article
      className="rounded-lg border border-slate-200 bg-white p-4"
      aria-label={`Cuadre de congelamiento de la jornada de Envasado del ${formatIsoDate(origin.originDate)}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500">
            Jornada de Envasado · {formatIsoWeekday(origin.originDate)}
          </p>
          <Link
            to={`/jornadas/${origin.originDate}?process=PACKING`}
            className="text-sm font-bold text-brand-800 underline-offset-2 hover:underline"
          >
            {formatIsoDate(origin.originDate)}
          </Link>
        </div>
        <StatusBadge tone={state.tone} truncateText={false}>
          {state.label}
        </StatusBadge>
      </header>

      <dl className="mt-3 text-xs">
        <Row label="Envasado Turno Día" hint="propio" value={formatCentiKg(origin.ownDayKg100)} />
        <Row label="Envasado Turno Noche" hint="propio" value={formatCentiKg(origin.ownNightKg100)} />
        <Row label="Saldo al cierre" hint="queda en esta jornada" value={formatCentiKg(origin.closingBalanceKg100)} />
        <div className="my-1 border-t border-slate-200" />
        <Row label="Disponible para congelar" value={formatCentiKg(origin.availableKg100)} emphasis />
        <Row
          label="Congelado"
          hint={`Día ${formatCentiKg(origin.frozenDayKg100)} · Noche ${formatCentiKg(origin.frozenNightKg100)}`}
          value={formatCentiKg(origin.frozenKg100)}
        />
        {origin.excessKg100 > 0 ? (
          <div className="flex items-baseline justify-between gap-3 py-1 font-bold text-rose-700 dark:text-rose-300">
            <dt>Exceso congelado</dt>
            <dd className="number-tabular">{formatCentiKg(origin.excessKg100)}</dd>
          </div>
        ) : null}
        <Row label="Pendiente de congelar" value={formatCentiKg(origin.pendingKg100)} emphasis />
      </dl>

      <div className="mt-3 space-y-1.5 text-[0.6875rem] leading-4 text-slate-500">
        {origin.receivedBalanceKg100 > 0 ? (
          <p>
            Reporte físico: Día {formatCentiKg(origin.physicalDayKg100)} · Noche{' '}
            {formatCentiKg(origin.physicalNightKg100)}. Incluye{' '}
            {formatCentiKg(origin.receivedBalanceKg100)} de saldo de jornadas
            anteriores, que se cuentan en su jornada de origen y no aquí.
          </p>
        ) : null}
        {origin.state === 'PENDING' ? (
          <p>
            El pendiente sigue perteneciendo a esta jornada. Puede congelarse en
            otro turno, día o semana; FIFO lo consume antes que orígenes más
            recientes.
          </p>
        ) : null}
        {origin.state === 'EXCESS' ? (
          <p className="font-semibold text-rose-700 dark:text-rose-300">
            Se vinculó a esta jornada más producto del que envasó. Revisa los
            vínculos FIFO de las jornadas de Congelamiento.
          </p>
        ) : null}
      </div>
    </article>
  )
}

/**
 * Visible explanation of the Packing → Freezing reconciliation per origin
 * journey, so a difference is never shown without its source.
 */
export function FreezingAvailabilityExplanation({
  origins,
}: FreezingAvailabilityExplanationProps) {
  if (origins.length === 0) return null

  return (
    <SectionCard
      title="Cuadre Envasado → Congelamiento por jornada"
      description="Disponible = Envasado Día propio + Envasado Noche propio + Saldo al cierre. El saldo recibido de otra jornada se cuenta solo en su jornada de origen."
      contentClassName="grid gap-3 p-4 sm:p-5 lg:grid-cols-2 2xl:grid-cols-3"
    >
      {origins.map((origin) => (
        <OriginCard key={origin.originDayId} origin={origin} />
      ))}
    </SectionCard>
  )
}
