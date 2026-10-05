import { quarantineStoredData } from "../../../storage/storageQuarantine";
import {
  getOperationalWeekContext,
  getOperationalWeekContextByNumber,
  getOperationalWeekState,
  type OperationalWeekBusinessStatus,
} from "../../../utils/operationalContext";
import { WEEK_36_2026_SUBSEQUENT_BALANCE_LOTS } from "../data/week36";
import {
  getProductionProcess,
  isProductionProcess,
  productionDayKey,
} from "../model/productionProcess";
import type {
  ProductionDay,
  ProductionProcess,
  WeeklySummaryPeriod,
} from "../model/types";
import {
  getWeekClosureBlockers,
  isWeekAutomaticallyClosed,
} from "../model/weekLifecycle";
import {
  ACTIVE_PROCESS_STORAGE_KEY,
  ACTIVE_WEEK_STORAGE_KEY,
  DAYS_STORAGE_KEY,
  LEGACY_DAYS_STORAGE_KEY,
  LEGACY_WEEK_CLOSURES_STORAGE_KEY,
  PERMANENT_DAY_KEYS,
  PERMANENT_PRODUCTION_DAYS,
  PERMANENT_WEEK_NUMBERS,
  PERMANENTLY_CLOSED_WEEK_NUMBERS,
  SEEDED_WEEK_NUMBER,
  WEEK_CLOSURES_STORAGE_KEY,
} from "./productionDataConstants";
import type {
  OperationalCalendarDay,
  OperationalWeekView,
  ProductionDataValue,
  StoredWeekClosure,
  WeekClosureType,
} from "./productionDataTypes";

export const weekdayFormatter = new Intl.DateTimeFormat("es-PE", {
  weekday: "long",
  timeZone: "UTC",
});

export function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase("es-PE") + value.slice(1);
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function buildCalendarDays(
  period: WeeklySummaryPeriod,
): readonly OperationalCalendarDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const isoDate = addDays(period.startDate, index);
    return {
      label: capitalize(
        weekdayFormatter.format(new Date(`${isoDate}T00:00:00Z`)),
      ),
      date: formatShortDate(isoDate),
      isoDate,
    };
  });
}

export function isProductionDay(value: unknown): value is ProductionDay {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ProductionDay>;

  return (
    typeof candidate.id === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(candidate.date ?? "") &&
    typeof candidate.displayName === "string" &&
    Array.isArray(candidate.rawMaterialEntries) &&
    Array.isArray(candidate.lines) &&
    Array.isArray(candidate.receivedBalanceLots) &&
    typeof candidate.declaredRawMaterialKg100 === "number" &&
    typeof candidate.declaredFinishedTotalKg100 === "number" &&
    (candidate.process === undefined || isProductionProcess(candidate.process))
  );
}

export function normalizeNucaClassification(day: ProductionDay): ProductionDay {
  const semilimpiaProductIds = new Set(
    day.lines
      .filter((line) => {
        const normalizedProductName = line.productName
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLocaleUpperCase("es-PE");

        return (
          line.productId === "nuca-semilimpia-codificada" ||
          (normalizedProductName.includes("NUCA") &&
            normalizedProductName.includes("SEMI LIMPI"))
        );
      })
      .map((line) => line.productId),
  );

  if (semilimpiaProductIds.size === 0) return day;

  return {
    ...day,
    lines: day.lines.map((line) =>
      semilimpiaProductIds.has(line.productId)
        ? {
            ...line,
            familyId: "nuca-semilimpia",
            familyName: "NUCA SEMILIMPIA",
            summaryGroupId: "NUCA_SEMILIMPIA",
          }
        : line,
    ),
    receivedBalanceLots: day.receivedBalanceLots.map((lot) =>
      semilimpiaProductIds.has(lot.productId)
        ? { ...lot, familyId: "nuca-semilimpia" }
        : lot,
    ),
  };
}

export function loadStoredDays(): readonly ProductionDay[] {
  if (typeof window === "undefined") return [];

  try {
    const currentStored = window.localStorage.getItem(DAYS_STORAGE_KEY);
    const legacyStored = window.localStorage.getItem(LEGACY_DAYS_STORAGE_KEY);
    const stored = currentStored ?? legacyStored ?? "[]";
    const sourceKey =
      currentStored !== null ? DAYS_STORAGE_KEY : LEGACY_DAYS_STORAGE_KEY;
    let parsed: unknown;
    try {
      parsed = JSON.parse(stored);
    } catch {
      // The next save rewrites this key from memory; keep a copy first.
      quarantineStoredData(sourceKey, "INVALID_JSON", stored);
      return [];
    }
    if (Array.isArray(parsed)) {
      const rejected = parsed.filter((record) => !isProductionDay(record));
      if (rejected.length > 0) {
        quarantineStoredData(sourceKey, "INVALID_RECORD", rejected);
      }
      const shadowedByPermanent = parsed.filter(
        (record) =>
          isProductionDay(record) &&
          PERMANENT_DAY_KEYS.has(
            productionDayKey(record.date, getProductionProcess(record)),
          ),
      );
      if (shadowedByPermanent.length > 0) {
        quarantineStoredData(
          sourceKey,
          "PERMANENT_DAY_COLLISION",
          shadowedByPermanent,
        );
      }
    } else if (parsed !== null) {
      quarantineStoredData(sourceKey, "INVALID_RECORD", parsed);
    }
    const normalized = Array.isArray(parsed)
      ? parsed
          .filter(isProductionDay)
          .map(normalizeNucaClassification)
          .map((day) => ({
            ...day,
            process: getProductionProcess(day),
            receivedBalanceLots: day.receivedBalanceLots.map((lot) => ({
              ...lot,
              process: isProductionProcess(lot.process)
                ? lot.process
                : getProductionProcess(day),
            })),
          }))
          .filter(
            (day) =>
              !PERMANENT_DAY_KEYS.has(
                productionDayKey(day.date, getProductionProcess(day)),
              ),
          )
      : [];
    if (currentStored === null && legacyStored !== null) {
      window.localStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return [];
  }
}

export function isStoredWeekClosure(
  value: unknown,
): value is StoredWeekClosure {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredWeekClosure>;
  return (
    Number.isSafeInteger(candidate.weekNumber) &&
    isProductionProcess(candidate.process ?? "PACKING") &&
    candidate.status === "CLOSED" &&
    candidate.closureType === "MANUAL" &&
    typeof candidate.closedAt === "string"
  );
}

export function loadStoredWeekClosures(): readonly StoredWeekClosure[] {
  if (typeof window === "undefined") return [];

  try {
    const currentStored = window.localStorage.getItem(
      WEEK_CLOSURES_STORAGE_KEY,
    );
    const legacyStored = window.localStorage.getItem(
      LEGACY_WEEK_CLOSURES_STORAGE_KEY,
    );
    const stored = currentStored ?? legacyStored ?? "[]";
    const sourceKey =
      currentStored !== null
        ? WEEK_CLOSURES_STORAGE_KEY
        : LEGACY_WEEK_CLOSURES_STORAGE_KEY;
    let parsed: unknown;
    try {
      parsed = JSON.parse(stored);
    } catch {
      quarantineStoredData(sourceKey, "INVALID_JSON", stored);
      return [];
    }
    if (Array.isArray(parsed)) {
      const rejected = parsed.filter((record) => !isStoredWeekClosure(record));
      if (rejected.length > 0) {
        quarantineStoredData(sourceKey, "INVALID_RECORD", rejected);
      }
    } else if (parsed !== null) {
      quarantineStoredData(sourceKey, "INVALID_RECORD", parsed);
    }
    const normalized = Array.isArray(parsed)
      ? parsed.filter(isStoredWeekClosure).map((closure) => ({
          ...closure,
          process: closure.process ?? "PACKING",
        }))
      : [];
    if (currentStored === null && legacyStored !== null) {
      window.localStorage.setItem(
        WEEK_CLOSURES_STORAGE_KEY,
        JSON.stringify(normalized),
      );
    }
    return normalized;
  } catch {
    return [];
  }
}

export function getInitialActiveProcess(): ProductionProcess {
  if (typeof window === "undefined") return "PACKING";
  const stored = window.localStorage.getItem(ACTIVE_PROCESS_STORAGE_KEY);
  return isProductionProcess(stored) ? stored : "PACKING";
}

export function getInitialActiveWeek(): number {
  const currentWeek = getOperationalWeekContext(new Date());
  if (typeof window === "undefined") return currentWeek.number;

  const storedWeek = Number(
    window.localStorage.getItem(ACTIVE_WEEK_STORAGE_KEY),
  );
  const storedWeekState = Number.isSafeInteger(storedWeek)
    ? getOperationalWeekState(
        getOperationalWeekContextByNumber(storedWeek),
        currentWeek,
      )
    : null;
  if (
    Number.isSafeInteger(storedWeek) &&
    storedWeek >= SEEDED_WEEK_NUMBER &&
    storedWeekState?.isFuture === false
  ) {
    return storedWeek;
  }

  try {
    window.localStorage.setItem(
      ACTIVE_WEEK_STORAGE_KEY,
      String(currentWeek.number),
    );
  } catch {
    // The valid week is still used when storage is unavailable.
  }
  return currentWeek.number;
}

export function sortDays(
  days: readonly ProductionDay[],
): readonly ProductionDay[] {
  return [...days].sort(
    (first, second) =>
      first.date.localeCompare(second.date) ||
      getProductionProcess(first).localeCompare(getProductionProcess(second)),
  );
}

export function getWeekProductionDays(
  number: number,
  userDays: readonly ProductionDay[],
  process: ProductionProcess,
): readonly ProductionDay[] {
  const { period } = getOperationalWeekContextByNumber(number);
  const permanentDays = PERMANENT_PRODUCTION_DAYS.filter(
    (day) =>
      getProductionProcess(day) === process &&
      day.date >= period.startDate &&
      day.date <= period.endDate,
  );

  return sortDays([
    ...permanentDays,
    ...userDays.filter(
      (day) =>
        day.date >= period.startDate &&
        day.date <= period.endDate &&
        getProductionProcess(day) === process &&
        !PERMANENT_DAY_KEYS.has(productionDayKey(day.date, process)),
    ),
  ]);
}

export function resolveWeekClosure(
  number: number,
  process: ProductionProcess,
  period: WeeklySummaryPeriod,
  productionDays: readonly ProductionDay[],
  storedClosures: readonly StoredWeekClosure[],
): { closureType: WeekClosureType | null; closedAt: string | null } {
  if (process === "PACKING" && PERMANENTLY_CLOSED_WEEK_NUMBERS.has(number)) {
    return { closureType: "PERMANENT", closedAt: null };
  }

  const manualClosure = storedClosures.find(
    (closure) => closure.weekNumber === number && closure.process === process,
  );
  if (manualClosure) {
    return {
      closureType: manualClosure.closureType,
      closedAt: manualClosure.closedAt,
    };
  }

  if (isWeekAutomaticallyClosed(period, productionDays)) {
    return { closureType: "AUTOMATIC", closedAt: null };
  }

  return { closureType: null, closedAt: null };
}

export function buildWeekView(
  number: number,
  userDays: readonly ProductionDay[],
  process: ProductionProcess = "PACKING",
  storedClosures: readonly StoredWeekClosure[] = [],
  currentWeek = getOperationalWeekContext(new Date()),
): OperationalWeekView {
  const { period } = getOperationalWeekContextByNumber(number);
  const productionDays = getWeekProductionDays(number, userDays, process);
  const closure = resolveWeekClosure(
    number,
    process,
    period,
    productionDays,
    storedClosures,
  );
  const businessStatus: OperationalWeekBusinessStatus = closure.closureType
    ? "CLOSED"
    : "OPEN";
  const state = getOperationalWeekState(
    { number, period },
    currentWeek,
    businessStatus,
  );
  const closureBlockers = getWeekClosureBlockers(productionDays);

  return {
    number,
    process,
    period,
    calendarDays: buildCalendarDays(period),
    productionDays,
    ...state,
    closureType: closure.closureType,
    closedAt: closure.closedAt,
    canCloseManually: businessStatus === "OPEN" && !state.isFuture,
    closureBlockers,
  };
}

export const historicalWeek = buildWeekView(SEEDED_WEEK_NUMBER, []);
export const currentWeekAtStartup = getOperationalWeekContext(
  new Date(),
).number;

export const fallbackValue: ProductionDataValue = {
  activeWeek: historicalWeek,
  activeProcess: "PACKING",
  activeWeekNumber: SEEDED_WEEK_NUMBER,
  availableWeekNumbers: [
    ...new Set([...PERMANENT_WEEK_NUMBERS, currentWeekAtStartup]),
  ],
  allProductionDays: PERMANENT_PRODUCTION_DAYS,
  subsequentBalanceLots: WEEK_36_2026_SUBSEQUENT_BALANCE_LOTS,
  setActiveWeekNumber: () => undefined,
  setActiveProcess: () => undefined,
  getWeekState: (weekNumber, process = "PACKING") => {
    const week = buildWeekView(weekNumber, [], process);
    return getOperationalWeekState(
      week,
      getOperationalWeekContext(new Date()),
      week.businessStatus,
    );
  },
  getWeekView: (weekNumber, process = "PACKING") =>
    buildWeekView(weekNumber, [], process),
  closeWeekManually: () => {
    throw new Error("ProductionDataProvider is required to close weeks.");
  },
  findProductionDay: (date, process = "PACKING") =>
    PERMANENT_PRODUCTION_DAYS.find(
      (day) => day.date === date && getProductionProcess(day) === process,
    ),
  isUserManagedDay: () => false,
  upsertProductionDay: () => {
    throw new Error(
      "ProductionDataProvider is required to save production days.",
    );
  },
};
