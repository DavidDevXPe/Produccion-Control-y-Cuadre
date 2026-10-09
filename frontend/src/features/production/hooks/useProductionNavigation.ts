import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useProductionData } from "../state/ProductionDataContext";
import {
  getPreviousProcess,
  getProductionProcess,
  isProductionProcess,
  productionDayKey,
} from "../model/productionProcess";
import { getOperationalWeekContextForIsoDate } from "../../../utils/operationalContext";
import {
  buildProductionDayFromCapture,
  createCaptureDraftFromDay,
  createEmptyCaptureDraft,
  type ProductionCaptureDraft,
} from "../capture/productionCapture";
import {
  captureQuantityKg100,
  isCaptureDraftEmpty,
  type CaptureMode,
} from "../capture/productionEntryHelpers";
import { isSundayIsoDate } from "../model/productionDayMode";
import type { ProductionDay, ProductionProcess } from "../model/types";

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

  const suggestedDate = useMemo(() => {
    if (!activeWeekState.canCreate) return activeWeek.period.startDate;

    const previousProcess = getPreviousProcess(selectedProcess);
    if (previousProcess) {
      const upstreamDays = activeWeek.calendarDays
        .filter((day) => {
          const upstreamDay = findProductionDay(day.isoDate, previousProcess);
          return Boolean(upstreamDay);
        })
        .map((day) => day.isoDate);

      if (upstreamDays.length > 0) {
        const pendingDownstream = upstreamDays.find(
          (date) => !findProductionDay(date, selectedProcess),
        );
        return pendingDownstream ?? upstreamDays[upstreamDays.length - 1]!;
      }
    }

    return (
      activeWeek.calendarDays.find(
        (day) => !findProductionDay(day.isoDate, selectedProcess),
      )?.isoDate ?? activeWeek.period.startDate
    );
  }, [activeWeek, activeWeekState.canCreate, findProductionDay, selectedProcess]);

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

  const [processDrafts, setProcessDrafts] = useState<
    Partial<Record<ProductionProcess, ProductionCaptureDraft>>
  >(() => ({ [draft.process]: draft }));
  const [processModes, setProcessModes] = useState<
    Partial<Record<ProductionProcess, CaptureMode>>
  >(() => ({ [draft.process]: mode }));

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
  const usesExternalAvailability = isBalanceOnly || draft.process !== "PACKING";

  const effectiveProductionDays = useMemo(() => {
    const daysMap = new Map<string, ProductionDay>();
    for (const day of allProductionDays) {
      daysMap.set(productionDayKey(day.date, getProductionProcess(day)), day);
    }

    if (editingDate && editingDate !== draft.date) {
      daysMap.delete(productionDayKey(editingDate, selectedProcess));
    }

    const activeDrafts = [
      ...Object.values(processDrafts),
      draft,
    ].filter(Boolean) as ProductionCaptureDraft[];

    for (const processDraft of activeDrafts) {
      if (!processDraft?.date || !processDraft?.process) continue;
      const hasContent =
        processDraft.rows.some(
          (r) =>
            captureQuantityKg100(r.dayReportedKg) > 0 ||
            captureQuantityKg100(r.nightReportedKg) > 0 ||
            captureQuantityKg100(r.closingBalanceKg) > 0,
        ) ||
        (Boolean(processDraft.declaredDayTotalKg) &&
          processDraft.declaredDayTotalKg !== "0") ||
        (Boolean(processDraft.declaredNightTotalKg) &&
          processDraft.declaredNightTotalKg !== "0") ||
        (Boolean(processDraft.rawMaterialKg) &&
          processDraft.rawMaterialKg !== "0");

      if (hasContent) {
        try {
          const buildResult = buildProductionDayFromCapture(
            processDraft,
            allProductionDays.filter(
              (d) =>
                productionDayKey(d.date, getProductionProcess(d)) !==
                  productionDayKey(processDraft.date, processDraft.process) &&
                (!editingDate ||
                  productionDayKey(d.date, getProductionProcess(d)) !==
                    productionDayKey(editingDate, processDraft.process)),
            ),
            subsequentBalanceLots,
          );
          daysMap.set(
            productionDayKey(processDraft.date, processDraft.process),
            buildResult.productionDay,
          );
        } catch {
          // Ignore partial build errors
        }
      }
    }

    return Array.from(daysMap.values());
  }, [
    allProductionDays,
    processDrafts,
    draft,
    subsequentBalanceLots,
    editingDate,
    selectedProcess,
  ]);

  const applyProcessChange = (process: ProductionProcess) => {
    if (editingDate || process === draft.process) return;
    const processWeek = getWeekView(activeWeek.number, process);

    // Keep draft.date if it belongs to the active week!
    const targetDate = processWeek.calendarDays.some(
      (day) => day.isoDate === draft.date,
    )
      ? draft.date
      : (processWeek.calendarDays.find(
          (day) => !findProductionDay(day.isoDate, process),
        )?.isoDate ?? processWeek.period.startDate);

    setActiveProcess(process);
    setSearchParams({ process }, { replace: true });

    const updatedDrafts = { ...processDrafts, [draft.process]: draft };
    const updatedModes = { ...processModes, [draft.process]: mode };

    let nextDraft = updatedDrafts[process];
    if (!nextDraft || nextDraft.date !== targetDate) {
      const existingTargetDay = findProductionDay(targetDate, process);
      nextDraft = existingTargetDay
        ? createCaptureDraftFromDay(existingTargetDay, effectiveProductionDays)
        : createEmptyCaptureDraft(targetDate, process);
      updatedDrafts[process] = nextDraft;
    }

    setProcessDrafts(updatedDrafts);
    setProcessModes(updatedModes);
    setMode(updatedModes[process] ?? "MANUAL");
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
    effectiveProductionDays,
    subsequentBalanceLots,
    upsertProductionDay,
  };
}
