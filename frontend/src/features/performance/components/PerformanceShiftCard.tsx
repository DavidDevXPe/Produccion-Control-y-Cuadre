import { Clock3, Save, UsersRound } from 'lucide-react'
import { useMemo, useState } from 'react'
import { buttonStyles } from '../../../components/ui/buttonStyles'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { formatCentiKg } from '../../../utils/formatters'
import { kg100 } from '../../production/model/calculations'
import { getProductionProcess } from '../../production/model/productionProcess'
import type { ProductionDay, ShiftCode } from '../../production/model/types'
import {
  calculatePerformanceRecord,
  findWeeklyShiftBenchmark,
  withPerformanceBenchmark,
} from '../model/performanceCalculations'
import { PERFORMANCE_BENCHMARKS } from '../model/performanceConfig'
import type { PerformanceRecord, PerformanceRecordInput } from '../model/types'

interface PerformanceShiftCardProps {
  productionDay: ProductionDay
  shift: ShiftCode
  weekNumber: number
  storedRecord?: PerformanceRecordInput | undefined
  /** Saved records of the week, used for the weekly shift benchmark. */
  weekRecords?: readonly PerformanceRecord[]
  readOnly: boolean
  onSave: (record: PerformanceRecordInput) => void
}

function formatMetric(value: number | null, suffix = ''): string {
  return value === null || !Number.isFinite(value)
    ? '—'
    : `${value.toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}${suffix}`
}

function parseNonNegative(value: string): number {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

const benchmarkStatusLabels = {
  NOT_CONFIGURED: 'NO CONFIGURADO',
  BELOW_TARGET: 'BAJO OBJETIVO',
  NEAR_TARGET: 'CERCA DEL OBJETIVO',
  AT_OR_ABOVE_TARGET: 'OBJETIVO / SOBRE OBJETIVO',
} as const

export function PerformanceShiftCard({
  productionDay,
  shift,
  weekNumber,
  storedRecord,
  weekRecords = [],
  readOnly,
  onSave,
}: PerformanceShiftCardProps) {
  const isDay = shift === 'DAY'
  const process = getProductionProcess(productionDay)
  const [supervisor, setSupervisor] = useState(storedRecord?.supervisor ?? '')
  const [workerCount, setWorkerCount] = useState(
    storedRecord?.workerCount ? String(storedRecord.workerCount) : '',
  )
  const [startTime, setStartTime] = useState(
    storedRecord?.startTime ?? (isDay ? '07:00' : '19:00'),
  )
  const [endTime, setEndTime] = useState(
    storedRecord?.endTime ?? (isDay ? '19:00' : '07:00'),
  )
  const [deadHours, setDeadHours] = useState(
    storedRecord ? String(storedRecord.deadHours) : '0',
  )
  const [saveState, setSaveState] = useState<'IDLE' | 'SAVED' | 'ERROR'>('IDLE')
  const input = useMemo<PerformanceRecordInput>(() => ({
    id: storedRecord?.id ?? `performance-${productionDay.id}-${shift}`,
    productionDayId: productionDay.id,
    date: productionDay.date,
    weekNumber,
    process,
    shift,
    supervisor,
    workerCount: parseNonNegative(workerCount),
    startTime,
    endTime,
    deadHours: parseNonNegative(deadHours),
    createdAt: storedRecord?.createdAt ?? '',
    updatedAt: storedRecord?.updatedAt ?? '',
  }), [
    deadHours,
    endTime,
    process,
    productionDay.date,
    productionDay.id,
    shift,
    startTime,
    storedRecord?.createdAt,
    storedRecord?.id,
    storedRecord?.updatedAt,
    supervisor,
    weekNumber,
    workerCount,
  ])
  const calculated = calculatePerformanceRecord(
    input,
    productionDay,
    PERFORMANCE_BENCHMARKS,
  )
  // Without a configured benchmark, the benchmark is the best Kg/persona-h of
  // this shift in the week. The values being edited count too, so the card
  // shows the same result it will have once saved.
  const weeklyBenchmark =
    calculated.benchmark !== null
      ? calculated.benchmark
      : findWeeklyShiftBenchmark(
          [
            ...weekRecords.filter((record) => record.id !== input.id),
            calculated,
          ],
          process,
          shift,
          weekNumber,
        )
  const performance = withPerformanceBenchmark(calculated, weeklyBenchmark)
  const workerLabel =
    process === 'PACKING' ? 'N° Envasadores' : 'N° Personal productivo'

  const save = () => {
    if (
      performance.scheduledHours === null ||
      input.deadHours > performance.scheduledHours
    ) {
      setSaveState('ERROR')
      return
    }
    const now = new Date().toISOString()
    onSave({
      ...input,
      createdAt: storedRecord?.createdAt || now,
      updatedAt: now,
    })
    setSaveState('SAVED')
  }

  return (
    <SectionCard
      title={`Turno ${isDay ? 'Día' : 'Noche'}`}
      description={`Fuente de kilos: Reporte ${isDay ? 'Día' : 'Noche'} · solo lectura.`}
      action={
        <StatusBadge tone={performance.isComplete ? 'success' : 'info'}>
          {performance.isComplete ? 'CALCULADO' : 'RENDIMIENTO PENDIENTE'}
        </StatusBadge>
      }
    >
      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-5">
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">Supervisor</span>
          <input
            type="text"
            value={supervisor}
            disabled={readOnly}
            onChange={(event) => { setSupervisor(event.target.value); setSaveState('IDLE') }}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">{workerLabel}</span>
          <span className="relative block">
            <UsersRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={workerCount}
              disabled={readOnly}
              onChange={(event) => { setWorkerCount(event.target.value); setSaveState('IDLE') }}
              className="number-tabular h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-right text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">Hora inicio</span>
          <input type="time" value={startTime} disabled={readOnly} onChange={(event) => { setStartTime(event.target.value); setSaveState('IDLE') }} className="number-tabular h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">Hora final</span>
          <input type="time" value={endTime} disabled={readOnly} onChange={(event) => { setEndTime(event.target.value); setSaveState('IDLE') }} className="number-tabular h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">Horas muertas</span>
          <span className="relative block">
            <Clock3 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input type="number" min="0" max={performance.scheduledHours ?? undefined} step="0.25" inputMode="decimal" value={deadHours} disabled={readOnly} onChange={(event) => { setDeadHours(event.target.value); setSaveState('IDLE') }} className="number-tabular h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-right text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100" />
          </span>
        </label>
      </div>

      <dl className="grid gap-px border-y border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Producto procesado', formatCentiKg(performance.processedKg100)],
          ['Horas programadas', formatMetric(performance.scheduledHours, ' h')],
          ['Horas efectivas', formatMetric(performance.effectiveHours, ' h')],
          ['Persona-h', formatMetric(performance.personHours)],
          ['Kg/h', formatMetric(performance.kgPerHour)],
          ['Kg/persona-h', formatMetric(performance.kgPerWorkerHour)],
          ['Benchmark (mejor del turno)', performance.benchmark === null ? 'SIN DATOS' : formatMetric(performance.benchmark)],
          ['Estado benchmark', benchmarkStatusLabels[performance.benchmarkStatus]],
          ['Cumplimiento', formatMetric(performance.benchmarkCompliance, '%')],
          ['Potencial', performance.potentialKg100 === null ? '—' : formatCentiKg(performance.potentialKg100)],
          [
            'Brecha',
            performance.productivityGapKg100 === null
              ? '—'
              : performance.productivityGapKg100 < 0
                ? `+${formatCentiKg(kg100(-performance.productivityGapKg100))} sobre benchmark`
                : formatCentiKg(performance.productivityGapKg100),
          ],
        ].map(([label, value]) => (
          <div key={label} className="bg-white px-3 py-3 text-center">
            <dt className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-slate-500">{label}</dt>
            <dd className="number-tabular mt-1 text-xs font-bold text-slate-950">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p
          className={`text-xs font-semibold ${saveState === 'ERROR' ? 'text-rose-700' : 'text-slate-500'}`}
          role={saveState === 'ERROR' ? 'alert' : 'status'}
        >
          {saveState === 'SAVED'
            ? 'Información de rendimiento guardada.'
            : saveState === 'ERROR'
              ? performance.validationMessage
              : performance.isComplete
                ? 'Indicadores recalculados con el reporte físico vigente.'
                : performance.validationMessage ?? 'Completa los datos operativos del turno.'}
        </p>
        {!readOnly ? (
          <button type="button" onClick={save} className={`${buttonStyles('primary', 'sm')} shrink-0`}>
            <Save className="size-4" aria-hidden="true" />
            Guardar rendimiento
          </button>
        ) : null}
      </div>
    </SectionCard>
  )
}
