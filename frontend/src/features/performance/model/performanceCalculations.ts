import { kg100, sumKg100, toKilograms } from '../../production/model/calculations'
import type { Kg100, ProductionDay, ShiftCode } from '../../production/model/types'
import type {
  PerformanceAggregate,
  PerformanceBenchmarkConfig,
  PerformanceBenchmarkStatus,
  PerformanceRecord,
  PerformanceRecordInput,
} from './types'

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/

function timeToMinutes(value: string): number | null {
  if (!TIME_PATTERN.test(value)) return null
  const [hours, minutes] = value.split(':').map(Number)
  return hours! * 60 + minutes!
}

export function calculateScheduledHours(
  startTime: string,
  endTime: string,
): number | null {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  if (startMinutes === null || endMinutes === null || startMinutes === endMinutes) {
    return null
  }
  const durationMinutes =
    endMinutes > startMinutes
      ? endMinutes - startMinutes
      : 24 * 60 - startMinutes + endMinutes
  return durationMinutes / 60
}

export function calculateEffectiveHours(
  scheduledHours: number | null,
  deadHours: number,
): number | null {
  if (
    scheduledHours === null ||
    !Number.isFinite(deadHours) ||
    deadHours < 0 ||
    deadHours > scheduledHours
  ) {
    return null
  }
  return scheduledHours - deadHours
}

export function calculatePersonHours(
  workerCount: number,
  effectiveHours: number | null,
): number | null {
  if (
    effectiveHours === null ||
    effectiveHours <= 0 ||
    !Number.isFinite(workerCount) ||
    workerCount <= 0
  ) {
    return null
  }
  return workerCount * effectiveHours
}

export function calculateKgPerHour(
  processedKg100: Kg100,
  effectiveHours: number | null,
): number | null {
  return effectiveHours === null || effectiveHours <= 0
    ? null
    : toKilograms(processedKg100) / effectiveHours
}

export function calculateKgPerPersonHour(
  processedKg100: Kg100,
  personHours: number | null,
): number | null {
  return personHours === null || personHours <= 0
    ? null
    : toKilograms(processedKg100) / personHours
}

export function calculateBenchmarkCompliance(
  kgPerWorkerHour: number | null,
  benchmark: number | null,
): number | null {
  return kgPerWorkerHour === null || benchmark === null || benchmark <= 0
    ? null
    : (kgPerWorkerHour / benchmark) * 100
}

export function calculatePotentialKg(
  personHours: number | null,
  benchmark: number | null,
) {
  return personHours === null || benchmark === null || benchmark <= 0
    ? null
    : kg100(Math.round(personHours * benchmark * 100))
}

export function calculateProductivityGap(
  potentialKg100: Kg100 | null,
  processedKg100: Kg100,
) {
  return potentialKg100 === null
    ? null
    : kg100(potentialKg100 - processedKg100)
}

export function getBenchmarkStatus(
  compliance: number | null,
): PerformanceBenchmarkStatus {
  if (compliance === null) return 'NOT_CONFIGURED'
  if (compliance >= 100) return 'AT_OR_ABOVE_TARGET'
  if (compliance >= 90) return 'NEAR_TARGET'
  return 'BELOW_TARGET'
}

export function findPerformanceBenchmark(
  configs: readonly PerformanceBenchmarkConfig[],
  process: PerformanceRecordInput['process'],
  shift: ShiftCode,
): number | null {
  return (
    configs.find(
      (config) => config.process === process && config.shift === shift,
    )?.kgPerWorkerHour ??
    configs.find(
      (config) => config.process === process && config.shift === undefined,
    )?.kgPerWorkerHour ??
    null
  )
}

export function calculatePerformanceRecord(
  input: PerformanceRecordInput,
  productionDay: ProductionDay,
  benchmarkConfigs: readonly PerformanceBenchmarkConfig[] = [],
): PerformanceRecord {
  const scheduledHours = calculateScheduledHours(input.startTime, input.endTime)
  const effectiveHours = calculateEffectiveHours(scheduledHours, input.deadHours)
  const processedKg100 = productionDay.declaredShiftTotalsKg100[input.shift]
  const personHours = calculatePersonHours(input.workerCount, effectiveHours)
  const kgPerHour = calculateKgPerHour(processedKg100, effectiveHours)
  const kgPerWorkerHour = calculateKgPerPersonHour(processedKg100, personHours)
  const benchmark = findPerformanceBenchmark(
    benchmarkConfigs,
    input.process,
    input.shift,
  )
  const benchmarkCompliance = calculateBenchmarkCompliance(
    kgPerWorkerHour,
    benchmark,
  )
  const potentialKg100 = calculatePotentialKg(personHours, benchmark)
  const productivityGapKg100 = calculateProductivityGap(
    potentialKg100,
    processedKg100,
  )
  const isComplete =
    input.supervisor.trim() !== '' &&
    Number.isInteger(input.workerCount) &&
    input.workerCount > 0 &&
    scheduledHours !== null &&
    effectiveHours !== null &&
    effectiveHours > 0
  const validationMessage =
    scheduledHours === null
      ? 'Ingresa un horario válido con inicio y fin diferentes.'
      : input.deadHours < 0 || input.deadHours > scheduledHours
        ? 'Las horas muertas deben estar entre 0 y las horas programadas.'
        : input.workerCount <= 0 || !Number.isInteger(input.workerCount)
          ? 'El número de personas debe ser un entero mayor que cero.'
          : input.supervisor.trim() === ''
            ? 'Ingresa el supervisor del turno.'
            : effectiveHours === 0
              ? 'Las horas efectivas deben ser mayores que cero.'
              : null

  return {
    ...input,
    scheduledHours,
    effectiveHours,
    processedKg100,
    personHours,
    kgPerHour,
    kgPerWorkerHour,
    benchmark,
    benchmarkCompliance,
    potentialKg100,
    productivityGapKg100,
    benchmarkStatus: getBenchmarkStatus(benchmarkCompliance),
    isComplete,
    validationMessage,
  }
}

/**
 * Recomputes the benchmark-dependent indicators of a record. Used when the
 * benchmark comes from the week itself (best Kg/persona-h of the shift).
 */
export function withPerformanceBenchmark(
  record: PerformanceRecord,
  benchmark: number | null,
): PerformanceRecord {
  const benchmarkCompliance = calculateBenchmarkCompliance(
    record.kgPerWorkerHour,
    benchmark,
  )
  const potentialKg100 = calculatePotentialKg(record.personHours, benchmark)

  return {
    ...record,
    benchmark,
    benchmarkCompliance,
    potentialKg100,
    productivityGapKg100: calculateProductivityGap(
      potentialKg100,
      record.processedKg100,
    ),
    benchmarkStatus: getBenchmarkStatus(benchmarkCompliance),
  }
}

/**
 * Weekly benchmark of one shift: the best Kg/persona-h reached by that shift
 * (Día or Noche) in the week, for the same process. Only complete records
 * count. Returns null when the shift has no calculable record.
 */
export function findWeeklyShiftBenchmark(
  records: readonly PerformanceRecord[],
  process: PerformanceRecordInput['process'],
  shift: ShiftCode,
  weekNumber: number,
): number | null {
  const values = records
    .filter(
      (record) =>
        record.isComplete &&
        record.process === process &&
        record.shift === shift &&
        record.weekNumber === weekNumber &&
        record.kgPerWorkerHour !== null,
    )
    .map((record) => record.kgPerWorkerHour!)

  return values.length > 0 ? Math.max(...values) : null
}

/**
 * Applies the weekly shift benchmark to every record without a configured
 * benchmark. A benchmark configured by Operations keeps precedence.
 */
export function applyWeeklyShiftBenchmarks(
  records: readonly PerformanceRecord[],
): readonly PerformanceRecord[] {
  return records.map((record) =>
    record.benchmark !== null
      ? record
      : withPerformanceBenchmark(
          record,
          findWeeklyShiftBenchmark(
            records,
            record.process,
            record.shift,
            record.weekNumber,
          ),
        ),
  )
}

export function aggregatePerformanceRecords(
  records: readonly PerformanceRecord[],
  benchmark: number | null = null,
): PerformanceAggregate {
  const completeRecords = records.filter((record) => record.isComplete)
  const processedKg100 = sumKg100(
    completeRecords.map((record) => record.processedKg100),
  )
  const effectiveHours = completeRecords.reduce(
    (total, record) => total + (record.effectiveHours ?? 0),
    0,
  )
  const personHours = completeRecords.reduce(
    (total, record) => total + (record.personHours ?? 0),
    0,
  )
  const kgPerHour = calculateKgPerHour(processedKg100, effectiveHours)
  const kgPerWorkerHour = calculateKgPerPersonHour(
    processedKg100,
    personHours,
  )
  // Without an explicit benchmark, each record carries its own (for example
  // the best Kg/persona-h of its shift). The weekly potential is then the sum
  // of the record potentials and the compliance is weighted: real kg over
  // potential kg. With a single benchmark both forms give the same result.
  const recordBenchmarks = new Set(
    completeRecords.map((record) => record.benchmark),
  )
  const recordsHavePotential =
    completeRecords.length > 0 &&
    completeRecords.every((record) => record.potentialKg100 !== null)
  const potentialKg100 =
    benchmark !== null
      ? calculatePotentialKg(personHours, benchmark)
      : recordsHavePotential
        ? sumKg100(completeRecords.map((record) => record.potentialKg100!))
        : null
  const benchmarkCompliance =
    benchmark !== null
      ? calculateBenchmarkCompliance(kgPerWorkerHour, benchmark)
      : potentialKg100 !== null && potentialKg100 > 0
        ? (processedKg100 / potentialKg100) * 100
        : null
  const aggregateBenchmark =
    benchmark ??
    (recordsHavePotential && recordBenchmarks.size === 1
      ? [...recordBenchmarks][0]!
      : null)

  return {
    processedKg100,
    effectiveHours,
    personHours,
    kgPerHour,
    kgPerWorkerHour,
    benchmark: aggregateBenchmark,
    benchmarkCompliance,
    potentialKg100,
    productivityGapKg100: calculateProductivityGap(
      potentialKg100,
      processedKg100,
    ),
    benchmarkStatus: getBenchmarkStatus(benchmarkCompliance),
    recordCount: records.length,
    completeRecordCount: completeRecords.length,
  }
}

export function getBestPerformanceShift(
  records: readonly PerformanceRecord[],
): ShiftCode | null {
  const byShift = (['DAY', 'NIGHT'] as const).map((shift) => ({
    shift,
    aggregate: aggregatePerformanceRecords(
      records.filter((record) => record.shift === shift),
    ),
  }))
  const calculable = byShift.filter(
    ({ aggregate }) => aggregate.kgPerWorkerHour !== null,
  )
  if (calculable.length === 0) return null
  return calculable.sort(
    (first, second) =>
      (second.aggregate.kgPerWorkerHour ?? 0) -
      (first.aggregate.kgPerWorkerHour ?? 0),
  )[0]!.shift
}
