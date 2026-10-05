import { useMemo, useState } from 'react'
import { SectionCard } from '../../../components/ui/SectionCard'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { getProductionProcess } from '../../production/model/productionProcess'
import type { ProductionDay, ShiftCode } from '../../production/model/types'
import {
  calculatePerformanceRecord,
  findWeeklyShiftBenchmark,
  withPerformanceBenchmark,
} from '../model/performanceCalculations'
import { PERFORMANCE_BENCHMARKS } from '../model/performanceConfig'
import type { PerformanceRecord, PerformanceRecordInput } from '../model/types'
import { PerformanceShiftInputs } from './shiftCard/PerformanceShiftInputs'
import { PerformanceShiftMetricsDl } from './shiftCard/PerformanceShiftMetricsDl'
import { PerformanceShiftSaveBar } from './shiftCard/PerformanceShiftSaveBar'
import { parseNonNegative } from './shiftCard/shiftCardTypes'

export interface PerformanceShiftCardProps {
  readonly productionDay: ProductionDay
  readonly shift: ShiftCode
  readonly weekNumber: number
  readonly storedRecord?: PerformanceRecordInput | undefined
  /** Saved records of the week, used for the weekly shift benchmark. */
  readonly weekRecords?: readonly PerformanceRecord[]
  readonly readOnly: boolean
  readonly onSave: (record: PerformanceRecordInput) => void
}

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
      <PerformanceShiftInputs
        supervisor={supervisor}
        workerCount={workerCount}
        startTime={startTime}
        endTime={endTime}
        deadHours={deadHours}
        workerLabel={workerLabel}
        scheduledHours={performance.scheduledHours}
        readOnly={readOnly}
        onSupervisorChange={(val) => {
          setSupervisor(val)
          setSaveState('IDLE')
        }}
        onWorkerCountChange={(val) => {
          setWorkerCount(val)
          setSaveState('IDLE')
        }}
        onStartTimeChange={(val) => {
          setStartTime(val)
          setSaveState('IDLE')
        }}
        onEndTimeChange={(val) => {
          setEndTime(val)
          setSaveState('IDLE')
        }}
        onDeadHoursChange={(val) => {
          setDeadHours(val)
          setSaveState('IDLE')
        }}
      />

      <PerformanceShiftMetricsDl performance={performance} />

      <PerformanceShiftSaveBar
        saveState={saveState}
        performance={performance}
        readOnly={readOnly}
        onSave={save}
      />
    </SectionCard>
  )
}

