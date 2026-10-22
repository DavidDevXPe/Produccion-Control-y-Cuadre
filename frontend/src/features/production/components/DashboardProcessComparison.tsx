import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Hourglass,
  PackageCheck,
  Snowflake,
  type LucideIcon,
} from 'lucide-react'
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

type TileTone = 'packing' | 'freezing' | 'pending' | 'success' | 'danger'

const tileToneClasses: Record<
  TileTone,
  { box: string; icon: string; value: string }
> = {
  packing: {
    box: 'border-sky-300 bg-sky-50 dark:border-sky-500/50 dark:bg-sky-500/10',
    icon: 'bg-sky-600 text-white',
    value: 'text-slate-950',
  },
  freezing: {
    box: 'border-blue-300 bg-blue-50 dark:border-blue-400/50 dark:bg-blue-500/10',
    icon: 'bg-blue-600 text-white',
    value: 'text-slate-950',
  },
  // Pending product is normal follow-up (FIFO will freeze it later), shown in
  // its own color so it is not confused with an error.
  pending: {
    box: 'border-amber-300 bg-amber-50 dark:border-amber-400/50 dark:bg-amber-500/10',
    icon: 'bg-amber-500 text-slate-950',
    value: 'text-slate-950',
  },
  success: {
    box: 'border-emerald-300 bg-emerald-50 dark:border-emerald-400/50 dark:bg-emerald-500/10',
    icon: 'bg-emerald-600 text-white',
    value: 'text-emerald-800 dark:text-emerald-300',
  },
  danger: {
    box: 'border-rose-300 bg-rose-50 dark:border-rose-400/50 dark:bg-rose-500/10',
    icon: 'bg-rose-600 text-white',
    value: 'text-rose-700 dark:text-rose-300',
  },
}

export function DashboardProcessComparison({
  comparison,
  hasFreezingData,
}: DashboardProcessComparisonProps) {
  const reviewReasons = describeFreezingReviewReasons(comparison)
  // The tile shows the net difference, but its status follows the comparison:
  // a link above the physical report is a review even when the net is zero.
  const needsReview = comparison.status === 'REVIEW'

  const packedTotal = comparison.packedKg100
  const frozenPercent =
    packedTotal > 0
      ? Math.min(100, Math.max(0, (comparison.frozenKg100 / packedTotal) * 100))
      : 0
  const pendingPercent =
    packedTotal > 0
      ? Math.min(
          100 - frozenPercent,
          Math.max(0, (comparison.pendingKg100 / packedTotal) * 100),
        )
      : 0
  const explainedKg100 = comparison.frozenKg100 + comparison.pendingKg100
  const explainedPercent =
    packedTotal > 0
      ? Math.min(100, Math.max(0, (explainedKg100 / packedTotal) * 100))
      : 100

  const tiles: readonly {
    label: string
    value: number
    tone: TileTone
    caption: string
    Icon: LucideIcon
  }[] = [
    {
      label: 'Envasado',
      value: comparison.packedKg100,
      tone: 'packing',
      caption: 'Origen productivo',
      Icon: PackageCheck,
    },
    {
      label: 'Congelado atribuible',
      value: comparison.frozenKg100,
      tone: 'freezing',
      caption: 'Aplicado a origen',
      Icon: Snowflake,
    },
    {
      label: 'Pendiente',
      value: comparison.pendingKg100,
      tone: comparison.pendingKg100 > 0 ? 'pending' : 'success',
      caption: 'Saldo trazable',
      Icon: Hourglass,
    },
    {
      label: 'Diferencia',
      value: comparison.unexplainedDifferenceKg100,
      tone: needsReview ? 'danger' : 'success',
      caption: needsReview ? 'Requiere revisión' : 'Conciliada',
      Icon: needsReview ? AlertTriangle : CheckCircle2,
    },
  ]

  return (
    <SectionCard
      title="Cuadre de producción (Envasado vs. Congelamiento)"
      description="Balance por origen productivo de la semana seleccionada."
      action={
        hasFreezingData ? (
          <StatusBadge tone={needsReview ? 'danger' : 'success'}>
            {needsReview ? 'REVISAR' : 'CONCILIADO'}
          </StatusBadge>
        ) : null
      }
      className="shrink-0"
      contentClassName="space-y-3 p-4"
    >
      {packedTotal > 0 ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-800">
              Estructura del volumen ({formatCentiKg(packedTotal)})
            </span>
            <span
              className={`number-tabular font-bold ${
                needsReview
                  ? 'text-rose-700 dark:text-rose-300'
                  : 'text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {explainedPercent.toFixed(1)}% explicado
            </span>
          </div>

          <div
            className="mt-1.5 flex h-2 w-full overflow-hidden rounded-full bg-slate-100"
            aria-label="Distribución de volumen entre Congelado y Saldo pendiente"
          >
            <div
              className="h-full bg-sky-500 transition-all"
              style={{ width: `${frozenPercent}%` }}
            />
            <div
              className="h-full bg-amber-500 transition-all"
              style={{ width: `${pendingPercent}%` }}
            />
          </div>

          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[0.6875rem] font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="size-2 rounded-full bg-sky-500"
                aria-hidden="true"
              />
              Congelado ({frozenPercent.toFixed(1)}%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="size-2 rounded-full bg-amber-500"
                aria-hidden="true"
              />
              Saldo pendiente ({pendingPercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      ) : null}

      {hasFreezingData ? (
        <>
          <ol
            aria-label="Flujo del cuadre"
            className="grid gap-2 sm:grid-cols-2"
          >
            {tiles.map((item, index) => (
              <li key={item.label} className="contents">
                {index > 0 ? (
                  <span className="sr-only" aria-hidden="true">
                    <ChevronRight className="size-4" />
                  </span>
                ) : null}
                <div
                  className={`min-w-0 rounded-lg border px-3 py-3 ${tileToneClasses[item.tone].box}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-md ${tileToneClasses[item.tone].icon}`}
                      aria-hidden="true"
                    >
                      <item.Icon className="size-4" />
                    </span>
                    <p className="min-w-0 text-[0.6875rem] font-bold uppercase leading-tight tracking-[0.05em] text-slate-600">
                      {item.label}
                    </p>
                  </div>
                  <p
                    className={`number-tabular mt-2 whitespace-nowrap text-[0.95rem] font-extrabold min-[1800px]:text-lg ${tileToneClasses[item.tone].value}`}
                  >
                    {formatCentiKg(item.value)}
                  </p>
                  <p className="mt-0.5 text-[0.6875rem] font-medium text-slate-600">
                    {item.caption}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {reviewReasons.length > 0 ? (
            <div className="flex gap-3 rounded-lg border border-rose-300 bg-rose-50 px-3.5 py-3 dark:border-rose-400/40 dark:bg-rose-500/10">
              <AlertTriangle
                className="mt-0.5 size-5 shrink-0 text-rose-700 dark:text-rose-300"
                aria-hidden="true"
              />
              <ul
                aria-label="Motivos de revisión del comparativo"
                className="space-y-1 text-xs leading-5 text-rose-900 dark:text-rose-100"
              >
                {reviewReasons.map(({ reason, title, message }) => (
                  <li key={reason}>
                    <strong className="text-rose-700 dark:text-rose-300">
                      {title}:
                    </strong>{' '}
                    {message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-4 border-t border-slate-100 pt-2">
            <ActionLink
              to="/saldos?process=FREEZING"
              variant="ghost"
              size="sm"
              className="-ml-3"
            >
              Ver detalle del cuadre
              <ArrowRight className="size-4" aria-hidden="true" />
            </ActionLink>
            <ActionLink to="/resumen?view=COMPARISON" variant="ghost" size="sm">
              Comparativo por familia
              <ArrowRight className="size-4" aria-hidden="true" />
            </ActionLink>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-600 text-white"
              aria-hidden="true"
            >
              <Snowflake className="size-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">
                Aún no hay jornadas de Congelamiento
              </p>
              <p className="mt-0.5 text-xs leading-5 text-slate-600">
                El cuadre se activará cuando se registre producto congelado.
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
