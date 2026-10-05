import { Clock3, UsersRound } from 'lucide-react'

export interface PerformanceShiftInputsProps {
  readonly supervisor: string
  readonly workerCount: string
  readonly startTime: string
  readonly endTime: string
  readonly deadHours: string
  readonly workerLabel: string
  readonly scheduledHours: number | null
  readonly readOnly: boolean
  readonly onSupervisorChange: (value: string) => void
  readonly onWorkerCountChange: (value: string) => void
  readonly onStartTimeChange: (value: string) => void
  readonly onEndTimeChange: (value: string) => void
  readonly onDeadHoursChange: (value: string) => void
}

export function PerformanceShiftInputs({
  supervisor,
  workerCount,
  startTime,
  endTime,
  deadHours,
  workerLabel,
  scheduledHours,
  readOnly,
  onSupervisorChange,
  onWorkerCountChange,
  onStartTimeChange,
  onEndTimeChange,
  onDeadHoursChange,
}: PerformanceShiftInputsProps) {
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-5">
      <label className="block sm:col-span-2">
        <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
          Supervisor
        </span>
        <input
          type="text"
          value={supervisor}
          disabled={readOnly}
          onChange={(event) => onSupervisorChange(event.target.value)}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
          {workerLabel}
        </span>
        <span className="relative block">
          <UsersRound
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={workerCount}
            disabled={readOnly}
            onChange={(event) => onWorkerCountChange(event.target.value)}
            className="number-tabular h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-right text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
          Hora inicio
        </span>
        <input
          type="time"
          value={startTime}
          disabled={readOnly}
          onChange={(event) => onStartTimeChange(event.target.value)}
          className="number-tabular h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
          Hora final
        </span>
        <input
          type="time"
          value={endTime}
          disabled={readOnly}
          onChange={(event) => onEndTimeChange(event.target.value)}
          className="number-tabular h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.06em] text-slate-500">
          Horas muertas
        </span>
        <span className="relative block">
          <Clock3
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="number"
            min="0"
            max={scheduledHours ?? undefined}
            step="0.25"
            inputMode="decimal"
            value={deadHours}
            disabled={readOnly}
            onChange={(event) => onDeadHoursChange(event.target.value)}
            className="number-tabular h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-right text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </span>
      </label>
    </div>
  )
}

