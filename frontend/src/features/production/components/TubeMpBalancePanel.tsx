import { Calculator, CircleAlert } from 'lucide-react'
import { MetricCard } from '../../../components/ui/MetricCard'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import type { TubeMpBalance } from '../model/tubeMpBalance'
import type { Kg100 } from '../model/types'

interface TubeMpBalancePanelProps {
  balance: TubeMpBalance
}

function TubeIntegrityMessages({ balance }: TubeMpBalancePanelProps) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-900">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>
        {balance.mpMantoExcessKg100 > 0 ? (
          <p>
            Manto requiere {formatCentiKg(balance.mpMantoExcessKg100)} más
            que la MP Tubo disponible.
          </p>
        ) : null}
        {balance.mpMainAnillasExcessKg100 > 0 ? (
          <p>
            Las Anillas principales requieren un exceso de{' '}
            {formatCentiKg(balance.mpMainAnillasExcessKg100)}.
          </p>
        ) : null}
        {balance.unclassifiedAnillasKg100 > 0 ? (
          <p>
            Hay {formatCentiKg(balance.unclassifiedAnillasKg100)} sin
            clasificación técnica Polar, General o USA.
          </p>
        ) : null}
        {balance.tubeDifferenceKg100 !== 0 ? (
          <p>
            El balance principal del Tubo presenta una diferencia de{' '}
            {formatCentiKg(balance.tubeDifferenceKg100)}.
          </p>
        ) : null}
      </div>
    </div>
  )
}

export function TubeMpBalancePanel({ balance }: TubeMpBalancePanelProps) {
  const hasAnillasProduction =
    balance.hasAnillasProduction ?? balance.ptAnillasKg100 > 0

  if (
    balance.mpTotalKg100 === 0 ||
    !hasAnillasProduction
  ) {
    return null
  }

  const hasIntegrityError =
    balance.mpMantoExcessKg100 > 0 ||
    balance.mpMainAnillasExcessKg100 > 0 ||
    balance.unclassifiedAnillasKg100 > 0 ||
    balance.tubeDifferenceKg100 !== 0

  return (
    <SectionCard
      title="Balance MP Tubo"
      description="Reconstrucción técnica de la bolsa Tubo, sin asignar una segunda materia prima a sus coproductos."
      action={
        <StatusBadge tone={hasIntegrityError ? 'danger' : 'success'}>
          {hasIntegrityError ? 'REVISAR INTEGRIDAD' : 'BALANCE TUBO 0.00 KG'}
        </StatusBadge>
      }
    >
      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
        <MetricCard
          label="MP Tubo"
          value={formatCentiKg(balance.mpTubeKg100)}
        />
        <MetricCard
          label="MP estimada Manto"
          value={formatCentiKg(balance.mpMantoEstimatedKg100)}
          description="PT Manto ÷ 80%"
        />
        <MetricCard
          label="MP proceso Anillas"
          value={formatCentiKg(balance.mpAnillaProcessKg100)}
          description="MP Tubo − MP Manto"
        />
        <MetricCard
          label="Diferencia balance Tubo"
          value={formatCentiKg(balance.tubeDifferenceKg100)}
          tone={balance.tubeDifferenceKg100 === 0 ? 'success' : 'danger'}
        />
      </div>

      <div className="border-t border-slate-200 bg-slate-50/55 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Calculator className="size-4 text-brand-700" aria-hidden="true" />
          <h3 className="text-sm font-bold text-slate-950">
            Detalle técnico de Anillas
          </h3>
        </div>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {([
            ['Polar · 36%', balance.mpAnillaPolarEstimatedKg100],
            ['Generales · 42%', balance.mpAnillaGeneralEstimatedKg100],
            ['USA · 34%', balance.mpAnillaUsaEstimatedKg100],
            ['MP principal explicada', balance.mpMainAnillasEstimatedKg100],
            ['MP técnica por distribuir', balance.mpAnillasUnallocatedKg100],
          ] satisfies readonly (readonly [string, Kg100])[]).map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
            >
              <dt className="text-[0.6875rem] font-semibold leading-4 text-slate-500">
                {String(label)}
              </dt>
              <dd className="number-tabular mt-1 whitespace-nowrap text-sm font-bold text-slate-950">
                {formatCentiKg(value)}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 border-t border-slate-200 pt-4">
          <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-700">
            Salidas del proceso de Anillas
          </h4>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Producto terminado trazable del mismo proceso; los coproductos no
            consumen una segunda MP.
          </p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {([
              ['Anillas principales', balance.processOutputs.mainAnillasKg100],
              ['Botón', balance.processOutputs.botonKg100],
              ['Recorte de Anillas', balance.processOutputs.recorteKg100],
              ['Membranas', balance.processOutputs.membranasKg100],
            ] satisfies readonly (readonly [string, Kg100])[]).map(
              ([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                >
                  <dt className="text-[0.6875rem] font-semibold leading-4 text-slate-500">
                    {label}
                  </dt>
                  <dd className="number-tabular mt-1 whitespace-nowrap text-sm font-bold text-slate-950">
                    {formatCentiKg(value)}
                  </dd>
                </div>
              ),
            )}
          </dl>
        </div>

        {balance.mpAnillasUnallocatedKg100 > 0 ? (
          <p className="mt-3 text-xs leading-5 text-slate-600">
            La MP técnica por distribuir pertenece al proceso global de Anillas;
            no se considera merma ni se asigna automáticamente a Botón, Recorte
            o Membranas.
          </p>
        ) : null}

        {hasIntegrityError ? <TubeIntegrityMessages balance={balance} /> : null}
      </div>
    </SectionCard>
  )
}

export default TubeMpBalancePanel
