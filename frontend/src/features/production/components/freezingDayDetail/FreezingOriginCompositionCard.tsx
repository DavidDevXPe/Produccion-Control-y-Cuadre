import { SectionCard } from '../../../../components/ui/SectionCard'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../../utils/formatters'
import type { Kg100 } from '../../model/types'

export interface FreezingOriginCompositionCardProps {
  readonly hasTraceabilityDifference: boolean
  readonly previousOriginUsedKg100: Kg100
  readonly currentOriginUsedKg100: Kg100
  readonly linkedKg100: Kg100
  readonly traceabilityDifferenceLabel: string
  readonly differenceKg100: Kg100
  readonly excessLinkedKg100: Kg100
  readonly unsupportedFrozenKg100: Kg100
}

export function FreezingOriginCompositionCard({
  hasTraceabilityDifference,
  previousOriginUsedKg100,
  currentOriginUsedKg100,
  linkedKg100,
  traceabilityDifferenceLabel,
  differenceKg100,
  excessLinkedKg100,
  unsupportedFrozenKg100,
}: FreezingOriginCompositionCardProps) {
  return (
    <SectionCard
      title="Origen del congelamiento"
      description="Cómo se compone el congelamiento entre saldos anteriores y disponibilidad de Envasado de esta jornada."
      action={
        <StatusBadge
          tone={hasTraceabilityDifference ? 'warning' : 'success'}
          truncateText={false}
        >
          {hasTraceabilityDifference ? 'CON OBSERVACIÓN' : 'ORIGEN COMPLETO'}
        </StatusBadge>
      }
    >
      <div className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-4 dark:bg-ui-line-dark-grid">
        <div className="bg-white px-4 py-4 text-center dark:bg-ui-surface-dark">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.07em] text-slate-500 dark:text-ui-text-soft">
            Saldo anterior utilizado
          </p>
          <p className="number-tabular mt-2 whitespace-nowrap text-lg font-extrabold text-amber-700 dark:text-amber-300">
            {formatCentiKg(previousOriginUsedKg100)}
          </p>
          <p className="mt-1 text-[0.625rem] text-slate-400 dark:text-ui-text-soft">
            Proveniente de jornadas anteriores
          </p>
        </div>

        <div className="bg-white px-4 py-4 text-center dark:bg-ui-surface-dark">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.07em] text-slate-500 dark:text-ui-text-soft">
            Envasado del día utilizado
          </p>
          <p className="number-tabular mt-2 whitespace-nowrap text-lg font-extrabold text-sky-700 dark:text-sky-300">
            {formatCentiKg(currentOriginUsedKg100)}
          </p>
          <p className="mt-1 text-[0.625rem] text-slate-400 dark:text-ui-text-soft">
            Disponible generado en esta jornada
          </p>
        </div>

        <div className="bg-white px-4 py-4 text-center dark:bg-ui-surface-dark">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.07em] text-slate-500 dark:text-ui-text-soft">
            Total vinculado
          </p>
          <p className="number-tabular mt-2 whitespace-nowrap text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
            {formatCentiKg(linkedKg100)}
          </p>
          <p className="mt-1 text-[0.625rem] text-slate-400 dark:text-ui-text-soft">
            Congelado con origen identificado
          </p>
        </div>

        <div className="bg-white px-4 py-4 text-center dark:bg-ui-surface-dark">
          <p className="text-[0.625rem] font-bold uppercase tracking-[0.07em] text-slate-500 dark:text-ui-text-soft">
            {traceabilityDifferenceLabel}
          </p>
          <p
            className={`number-tabular mt-2 whitespace-nowrap text-lg font-extrabold ${
              differenceKg100 === 0
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-amber-700 dark:text-amber-300'
            }`}
          >
            {formatCentiKg(
              excessLinkedKg100 > 0
                ? excessLinkedKg100
                : unsupportedFrozenKg100,
            )}
          </p>
          <p className="mt-1 text-[0.625rem] text-slate-400 dark:text-ui-text-soft">
            Diferencia de trazabilidad
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200 px-4 py-4 dark:border-ui-line-dark-grid sm:px-5">
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-500/20 dark:bg-sky-500/[0.06]">
          <p className="text-xs font-bold text-sky-900 dark:text-sky-200">
            Cómo se compone el congelamiento de esta jornada
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-ui-text-dark-pale">
            Se utilizaron{' '}
            <strong>{formatCentiKg(previousOriginUsedKg100)}</strong>{' '}
            de saldos anteriores y{' '}
            <strong>{formatCentiKg(currentOriginUsedKg100)}</strong> del
            Envasado de esta jornada. Total vinculado:{' '}
            <strong>{formatCentiKg(linkedKg100)}</strong>.
          </p>
        </div>
      </div>
    </SectionCard>
  )
}
