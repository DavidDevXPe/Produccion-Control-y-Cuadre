import { ArrowRight, Snowflake } from 'lucide-react'
import { ActionLink } from '../../../components/ui/ActionLink'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import type { FreezingComparison } from '../model/freezing'
import { describeFreezingReviewReasons } from '../presentation/freezingComparisonReasons'

interface DashboardProcessComparisonProps {
  comparison: FreezingComparison
  hasFreezingData: boolean
}

type TileTone = 'neutral' | 'info' | 'success' | 'danger'

const tileToneClasses: Record<TileTone, { box: string; value: string }> = {
  neutral: {
    box: 'border-slate-200 bg-slate-50',
    value: 'text-slate-950',
  },
  // A pending balance is information, not an observation.
  info: {
    box: 'border-brand-200 bg-brand-50',
    value: 'text-brand-800',
  },
  success: {
    box: 'border-emerald-200 bg-emerald-50',
    value: 'text-emerald-700',
  },
  danger: {
    box: 'border-rose-200 bg-rose-50',
    value: 'text-rose-700',
  },
}

export function DashboardProcessComparison({
  comparison,
  hasFreezingData,
}: DashboardProcessComparisonProps) {
  const reviewReasons = describeFreezingReviewReasons(comparison)
  // The tile shows the net difference, but its status follows the comparison:
  // a link above the physical report is a review even when the net is zero.
  const differenceTone: TileTone =
    comparison.status === 'REVIEW' ? 'danger' : 'success'
  const differenceCaption =
    comparison.status === 'REVIEW' ? 'Requiere revisión' : 'Conciliada'

  const tiles: readonly {
    label: string
    value: number
    tone: TileTone
    caption: string
  }[] = [
    {
      label: 'Envasado',
      value: comparison.packedKg100,
      tone: 'neutral',
      caption: 'Origen productivo',
    },
    {
      label: 'Congelado atribuible',
      value: comparison.frozenKg100,
      tone: 'neutral',
      caption: 'Aplicado a origen',
    },
    {
      label: 'Pendiente',
      value: comparison.pendingKg100,
      tone: comparison.pendingKg100 > 0 ? 'info' : 'success',
      caption: 'Saldo trazable',
    },
    {
      label: 'Diferencia',
      value: comparison.unexplainedDifferenceKg100,
      tone: differenceTone,
      caption: differenceCaption,
    },
  ]

  return (
    <SectionCard
      title="Envasado vs Congelamiento"
      description="Balance por origen productivo de la semana seleccionada."
      action={
        hasFreezingData ? (
          <StatusBadge
            tone={comparison.status === 'BALANCED' ? 'success' : 'danger'}
          >
            {comparison.status === 'BALANCED' ? 'CONCILIADO' : 'REVISAR'}
          </StatusBadge>
        ) : null
      }
      contentClassName="p-4"
    >
      {hasFreezingData ? (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {tiles.map((item) => (
              <div
                key={item.label}
                className={`rounded-lg border px-3.5 py-3 ${tileToneClasses[item.tone].box}`}
              >
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-600">
                  {item.label}
                </p>
                <p
                  className={`number-tabular mt-1 whitespace-nowrap text-lg font-extrabold ${tileToneClasses[item.tone].value}`}
                >
                  {formatCentiKg(item.value)}
                </p>
                <p className="mt-1 text-[0.625rem] font-semibold uppercase tracking-[0.05em] text-slate-500">
                  {item.caption}
                </p>
              </div>
            ))}
          </div>

          {reviewReasons.length > 0 ? (
            <ul
              aria-label="Motivos de revisión del comparativo"
              className="mt-3 space-y-1 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs leading-5 text-rose-800"
            >
              {reviewReasons.map(({ reason, title, message }) => (
                <li key={reason}>
                  <strong>{title}:</strong> {message}
                </li>
              ))}
            </ul>
          ) : null}

          <ActionLink
            to="/resumen?view=COMPARISON"
            variant="ghost"
            size="sm"
            className="mt-2 -ml-3"
          >
            Ver comparativo completo
            <ArrowRight className="size-4" aria-hidden="true" />
          </ActionLink>
        </>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700"
              aria-hidden="true"
            >
              <Snowflake className="size-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">
                Aún no hay jornadas de Congelamiento
              </p>
              <p className="mt-0.5 text-xs leading-5 text-slate-600">
                El comparativo se activará cuando se registre producto
                congelado.
              </p>
            </div>
          </div>
          <ActionLink to="/jornadas?process=FREEZING" variant="secondary" size="sm">
            Ver Congelamiento
            <ArrowRight className="size-4" aria-hidden="true" />
          </ActionLink>
        </div>
      )}
    </SectionCard>
  )
}
