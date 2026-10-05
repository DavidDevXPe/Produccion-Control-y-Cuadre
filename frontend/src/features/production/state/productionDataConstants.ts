import {
  TRABUNDA_LEGACY_STORAGE_KEYS,
  TRABUNDA_STORAGE_KEYS,
} from "../../../storage/trabundaStorage";
import { getOperationalWeekContextForIsoDate } from "../../../utils/operationalContext";
import { MONDAY_WEEK_42_PRODUCTION_DAY } from "../data/mondayWeek42";
import { WEEK_36_2026_PRODUCTION_DAYS } from "../data/week36";
import {
  getProductionProcess,
  productionDayKey,
} from "../model/productionProcess";
import type { ProductionDay } from "../model/types";

export const DAYS_STORAGE_KEY = TRABUNDA_STORAGE_KEYS.productionDays;
export const LEGACY_DAYS_STORAGE_KEY =
  TRABUNDA_LEGACY_STORAGE_KEYS.productionDays;
export const ACTIVE_WEEK_STORAGE_KEY =
  TRABUNDA_STORAGE_KEYS.activeOperationalWeek;
export const ACTIVE_PROCESS_STORAGE_KEY =
  TRABUNDA_STORAGE_KEYS.activeProductionProcess;
export const WEEK_CLOSURES_STORAGE_KEY =
  TRABUNDA_STORAGE_KEYS.weekProcessClosures;
export const LEGACY_WEEK_CLOSURES_STORAGE_KEY =
  TRABUNDA_LEGACY_STORAGE_KEYS.weekClosures;

export const SEEDED_WEEK_NUMBER = getOperationalWeekContextForIsoDate(
  WEEK_36_2026_PRODUCTION_DAYS[0]!.date,
).number;

export const PERMANENT_PRODUCTION_DAYS: readonly ProductionDay[] = [
  ...WEEK_36_2026_PRODUCTION_DAYS,
  MONDAY_WEEK_42_PRODUCTION_DAY,
];

export const PERMANENT_DAY_KEYS = new Set(
  PERMANENT_PRODUCTION_DAYS.map((day) =>
    productionDayKey(day.date, getProductionProcess(day)),
  ),
);

export const PERMANENT_WEEK_NUMBERS = [
  ...new Set(
    PERMANENT_PRODUCTION_DAYS.map(
      (day) => getOperationalWeekContextForIsoDate(day.date).number,
    ),
  ),
];

export const PERMANENTLY_CLOSED_WEEK_NUMBERS = new Set([SEEDED_WEEK_NUMBER]);
