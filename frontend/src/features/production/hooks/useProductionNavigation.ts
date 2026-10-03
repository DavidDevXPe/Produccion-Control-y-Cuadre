import { useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useProductionData } from "../state/ProductionDataContext";
import { isProductionProcess } from "../model/productionProcess";
import { getOperationalWeekContextForIsoDate } from "../../../utils/operationalContext";
import {
  createCaptureDraftFromDay,
  createEmptyCaptureDraft,
  type ProductionCaptureDraft,
} from "../capture/productionCapture";
import {
  isCaptureDraftEmpty,
  type CaptureMode,
} from "../capture/productionEntryHelpers";
import { isSundayIsoDate } from "../model/productionDayMode";
import type { ProductionProcess } from "../model/types";

export interface UseProductionNavigationOptions {
  onProcessChangeReset?: () => void;
  setSaveError?: (error: string) => void;
}

export function useProductionNavigation({
  onProcessChangeReset,
  setSaveError,
}: UseProductionNavigationOptions = {}) {
  const { date: editingDate } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    activeWeekNumber,
    allProductionDays,
    subsequentBalanceLots,
    findProductionDay,
    getWeekState,
    getWeekView,
    isUserManagedDay,
    activeProcess,
    setActiveProcess,
    upsertProductionDay,
  } = useProductionData();

  const processParam = searchParams.get("process");
  const selectedProcess = isProductionProcess(processParam)
    ? processParam
    : activeProcess;

  const activeWeek = getWeekView(activeWeekNumber, selectedProcess);
  const existingDay = editingDate
    ? findProductionDay(editingDate, selectedProcess)
    : undefined;

  const activeWeekState = activeWeek;
  const editingWeekState = editingDate
    ? getWeekState(
        getOperationalWeekContextForIsoDate(editingDate).number,
        selectedProcess,
      )
    : null;

  const isEditingAllowed = editingDate
    ? isUserManagedDay(editingDate, selectedProcess) &&
      existingDay?.status !== "CLOSED" &&
      editingWeekState?.canCreate === true
    : activeWeek.canCreate;

  const suggestedDate = activeWeekState.canCreate
    ? (activeWeek.calendarDays.find(
        (day) => !findProductionDay(day.isoDate, selectedProcess),
      )?.isoDate ?? activeWeek.period.startDate)
    : activeWeek.period.startDate;

  const [mode, setMode] = useState<CaptureMode>(
    existingDay?.lines.at(0)?.source.sheet === "CAPTURA WEB"
      ? "MANUAL"
      : existingDay
        ? "EXCEL"
        : "MANUAL",
  );

  const [draft, setDraft] = useState<ProductionCaptureDraft>(() =>
    existingDay
      ? createCaptureDraftFromDay(existingDay, allProductionDays)
      : createEmptyCaptureDraft(suggestedDate, selectedProcess),
  );

  const processDraftsRef = useRef<
    Partial<Record<ProductionProcess, ProductionCaptureDraft>>
  >({ [draft.process]: draft });
  const processModesRef = useRef<
    Partial<Record<ProductionProcess, CaptureMode>>
  >({ [draft.process]: mode });

  const [pendingProcessChange, setPendingProcessChange] =
    useState<ProductionProcess | null>(null);

  const updateDraft = <Key extends keyof ProductionCaptureDraft>(
    key: Key,
    value: ProductionCaptureDraft[Key],
  ) => setDraft((current) => ({ ...current, [key]: value }));

  const isSunday = isSundayIsoDate(draft.date);
  const isFreezing = draft.process === "FREEZING";
  const isBalanceOnly =
    isSunday && draft.operationMode === "BALANCE_ONLY" && !isFreezing;
  const usesExternalAvailability = isBalanceOnly || isFreezing;

  const applyProcessChange = (process: ProductionProcess) => {
    if (editingDate || process === draft.process) return;
    const processWeek = getWeekView(activeWeek.number, process);
    const nextDate =
      processWeek.calendarDays.find(
        (day) => !findProductionDay(day.isoDate, process),
      )?.isoDate ?? processWeek.period.startDate;

    setActiveProcess(process);
    setSearchParams({ process }, { replace: true });
    processDraftsRef.current[draft.process] = draft;
    processModesRef.current[draft.process] = mode;
    const nextDraft =
      processDraftsRef.current[process] ??
      createEmptyCaptureDraft(nextDate, process);
    processDraftsRef.current[process] = nextDraft;
    setMode(processModesRef.current[process] ?? "MANUAL");
    setDraft(nextDraft);
    onProcessChangeReset?.();
    setSaveError?.("");
  };

  const changeProcess = (process: ProductionProcess) => {
    if (editingDate || process === draft.process) return;
    if (!isCaptureDraftEmpty(draft)) {
      setPendingProcessChange(process);
      return;
    }
    applyProcessChange(process);
  };

  return {
    editingDate,
    navigate,
    selectedProcess,
    activeWeek,
    existingDay,
    isEditingAllowed,
    suggestedDate,
    mode,
    setMode,
    draft,
    setDraft,
    updateDraft,
    isSunday,
    isFreezing,
    isBalanceOnly,
    usesExternalAvailability,
    pendingProcessChange,
    setPendingProcessChange,
    changeProcess,
    applyProcessChange,
    allProductionDays,
    subsequentBalanceLots,
    upsertProductionDay,
  };
}
