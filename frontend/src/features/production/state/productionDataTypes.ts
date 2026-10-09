import type {
  OperationalWeekBusinessStatus,
  OperationalWeekState,
  OperationalWeekTemporalStatus,
} from "../../../utils/operationalContext";
import type {
  BalanceLot,
  ProductionDay,
  ProductionProcess,
  WeeklySummaryPeriod,
} from "../model/types";
import type { WeekClosureBlocker } from "../model/weekLifecycle";

export type WeekClosureType = "PERMANENT" | "MANUAL" | "AUTOMATIC";

export interface StoredWeekClosure {
  readonly weekNumber: number;
  readonly process: ProductionProcess;
  readonly status: "CLOSED";
  readonly closureType: "MANUAL";
  readonly closedAt: string;
}

export interface OperationalCalendarDay {
  label: string;
  date: string;
  isoDate: string;
}

export interface OperationalWeekView {
  number: number;
  process: ProductionProcess;
  period: WeeklySummaryPeriod;
  calendarDays: readonly OperationalCalendarDay[];
  productionDays: readonly ProductionDay[];
  temporalStatus: OperationalWeekTemporalStatus;
  businessStatus: OperationalWeekBusinessStatus;
  closureType: WeekClosureType | null;
  closedAt: string | null;
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
  isClosed: boolean;
  isReadOnly: boolean;
  canCreate: boolean;
  canCloseManually: boolean;
  closureBlockers: readonly WeekClosureBlocker[];
}

export interface ProductionDataValue {
  activeWeek: OperationalWeekView;
  activeProcess: ProductionProcess;
  activeWeekNumber: number;
  availableWeekNumbers: readonly number[];
  allProductionDays: readonly ProductionDay[];
  subsequentBalanceLots: readonly BalanceLot[];
  setActiveWeekNumber: (weekNumber: number) => void;
  setActiveProcess: (process: ProductionProcess) => void;
  getWeekState: (
    weekNumber: number,
    process?: ProductionProcess,
  ) => OperationalWeekState;
  getWeekView: (
    weekNumber: number,
    process?: ProductionProcess,
  ) => OperationalWeekView;
  closeWeekManually: (weekNumber: number, process?: ProductionProcess) => void;
  findProductionDay: (
    date: string,
    process?: ProductionProcess,
  ) => ProductionDay | undefined;
  isUserManagedDay: (date: string, process?: ProductionProcess) => boolean;
  upsertProductionDay: (
    productionDay: ProductionDay,
    options?: {
      allowReplace?: boolean | undefined;
      previousDate?: string | undefined;
    },
  ) => void;
  deleteProductionDay: (date: string, process?: ProductionProcess) => void;
}
