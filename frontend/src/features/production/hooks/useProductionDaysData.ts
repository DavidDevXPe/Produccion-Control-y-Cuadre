import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { calculateWeeklySummary, kg100, sumKg100 } from "../model/calculations";
import { calculateFreezingAvailability } from "../model/freezing";
import { isBalanceOnlyProductionDay } from "../model/productionDayMode";
import { getProductionDayOperationalState } from "../model/productionLifecycle";
import { isProductionProcess } from "../model/productionProcess";
import { getJourneyStatus } from "../presentation/journeyStatus";
import { getYieldStatus } from "../presentation/yieldStatus";
import { useProductionData } from "../state/ProductionDataContext";
import type { ProductionDay, ProductionProcess } from "../model/types";
import {
  formatIsoDateCompact,
  formatIsoWeekday,
} from "../../../utils/formatters";

export interface RegisteredProductionDayItem {
  day: ProductionDay;
  calculation: ReturnType<
    typeof getProductionDayOperationalState
  >["calculation"];
  operationalState: ReturnType<typeof getProductionDayOperationalState>;
  journey: ReturnType<typeof getJourneyStatus>;
}

export function useProductionDaysData() {
  const {
    activeWeekNumber,
    activeProcess,
    allProductionDays,
    closeWeekManually,
    getWeekView,
    setActiveProcess,
  } = useProductionData();

  const [searchParams, setSearchParams] = useSearchParams();
  const processParam = searchParams.get("process");
  const selectedProcess: ProductionProcess = isProductionProcess(processParam)
    ? processParam
    : activeProcess;

  const activeWeek = getWeekView(activeWeekNumber, selectedProcess);

  useEffect(() => {
    if (selectedProcess !== activeProcess) setActiveProcess(selectedProcess);
  }, [activeProcess, selectedProcess, setActiveProcess]);

  const activeWeekState = activeWeek;
  const [isWeekCloseOpen, setIsWeekCloseOpen] = useState(false);
  const [weekCloseError, setWeekCloseError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const packingWeek = getWeekView(activeWeekNumber, "PACKING");
  const freezingWeek = getWeekView(activeWeekNumber, "FREEZING");
  const packingDaysCount = packingWeek.productionDays.length;
  const freezingDaysCount = freezingWeek.productionDays.length;

  const isFreezing = selectedProcess === "FREEZING";

  const weeklySummary = useMemo(
    () => calculateWeeklySummary(activeWeek.productionDays, activeWeek.period),
    [activeWeek.productionDays, activeWeek.period],
  );

  const allRegisteredDays: RegisteredProductionDayItem[] = useMemo(() => {
    return activeWeek.productionDays.map((day) => {
      const operationalState = getProductionDayOperationalState(day);
      return {
        day,
        calculation: operationalState.calculation,
        operationalState,
        journey: getJourneyStatus(day, operationalState),
      };
    });
  }, [activeWeek.productionDays]);

  const registeredDays: RegisteredProductionDayItem[] = useMemo(() => {
    return allRegisteredDays.filter(({ day }) => {
      const matchesDate = !selectedDate || day.date === selectedDate;
      const matchesQuery =
        !searchQuery.trim() ||
        formatIsoWeekday(day.date)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        formatIsoDateCompact(day.date).includes(searchQuery) ||
        day.date.includes(searchQuery) ||
        Boolean(
          day.operationalPerformance?.supervisor &&
          day.operationalPerformance.supervisor
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
        );
      return matchesDate && matchesQuery;
    });
  }, [allRegisteredDays, searchQuery, selectedDate]);

  const balancedCount = useMemo(
    () =>
      registeredDays.filter(({ journey }) => journey.status === "BALANCED")
        .length,
    [registeredDays],
  );

  const belowReferenceCount = useMemo(() => {
    return registeredDays.filter(({ day, calculation }) => {
      if (isBalanceOnlyProductionDay(day)) return false;
      const status = getYieldStatus(calculation.performance.percent).status;
      return (
        status === "critical" || status === "low" || status === "acceptable"
      );
    }).length;
  }, [registeredDays]);

  const latestDay = activeWeek.productionDays.at(-1);

  const frozenPhysicalKg100 = useMemo(() => {
    return sumKg100(
      registeredDays.flatMap(({ day }) => [
        day.declaredShiftTotalsKg100.DAY,
        day.declaredShiftTotalsKg100.NIGHT,
      ]),
    );
  }, [registeredDays]);

  const freezingLinkedKg100 = useMemo(() => {
    return sumKg100(
      registeredDays.map(
        ({ calculation }) => calculation.processedPreviousBalanceKg100,
      ),
    );
  }, [registeredDays]);

  const freezingDifferenceKg100 = useMemo(
    () => kg100(frozenPhysicalKg100 - freezingLinkedKg100),
    [frozenPhysicalKg100, freezingLinkedKg100],
  );

  const freezingPendingKg100 = useMemo(() => {
    return sumKg100(
      calculateFreezingAvailability(
        allProductionDays,
        activeWeek.period.endDate,
      ).map((position) => position.pendingKg100),
    );
  }, [allProductionDays, activeWeek.period.endDate]);

  const missingCalendarDays = useMemo(() => {
    return activeWeek.calendarDays.filter(
      (calendarDay) =>
        !activeWeek.productionDays.some(
          (productionDay) => productionDay.date === calendarDay.isoDate,
        ),
    );
  }, [activeWeek.calendarDays, activeWeek.productionDays]);

  const isWeekFullySquared =
    registeredDays.length > 0 && balancedCount === registeredDays.length;

  const confirmWeekClosure = () => {
    setWeekCloseError("");
    try {
      closeWeekManually(activeWeek.number, selectedProcess);
      setIsWeekCloseOpen(false);
    } catch (error) {
      setWeekCloseError(
        error instanceof Error ? error.message : "No se pudo cerrar la semana.",
      );
    }
  };

  const handleSelectProcess = (process: "PACKING" | "FREEZING") => {
    setActiveProcess(process);
    setSearchParams({ process }, { replace: true });
  };

  const handleExportCsv = () => {
    const headers = [
      "Fecha",
      "Dia",
      isFreezing ? "Dia (kg)" : "Materia Prima (kg)",
      isFreezing ? "Noche (kg)" : "Producto Terminado (kg)",
      isFreezing ? "Total Congelado (kg)" : "Saldo Final (kg)",
      "Diferencia (kg)",
      "Estado Cuadre",
      isFreezing ? "Vinculado (kg)" : "Rendimiento (%)",
    ];

    const rows = registeredDays.map(({ day, calculation, journey }) => [
      day.date,
      formatIsoWeekday(day.date),
      isFreezing
        ? (day.declaredShiftTotalsKg100.DAY / 100).toFixed(2)
        : (day.declaredRawMaterialKg100 / 100).toFixed(2),
      isFreezing
        ? (day.declaredShiftTotalsKg100.NIGHT / 100).toFixed(2)
        : (calculation.declaredFinishedKg100 / 100).toFixed(2),
      isFreezing
        ? (
            (day.declaredShiftTotalsKg100.DAY +
              day.declaredShiftTotalsKg100.NIGHT) /
            100
          ).toFixed(2)
        : (calculation.newClosingBalanceKg100 / 100).toFixed(2),
      isFreezing
        ? (calculation.ownTurnProductionKg100 / 100).toFixed(2)
        : (calculation.differenceKg100 / 100).toFixed(2),
      journey.label,
      isFreezing
        ? (calculation.processedPreviousBalanceKg100 / 100).toFixed(2)
        : calculation.performance.percent !== null
          ? `${calculation.performance.percent.toFixed(2)}%`
          : "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `jornadas_semana_${activeWeek.number}_${selectedProcess.toLowerCase()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    selectedProcess,
    isFreezing,
    activeWeek,
    activeWeekState,
    packingDaysCount,
    freezingDaysCount,
    weeklySummary,
    allRegisteredDays,
    registeredDays,
    balancedCount,
    belowReferenceCount,
    latestDay,
    frozenPhysicalKg100,
    freezingLinkedKg100,
    freezingDifferenceKg100,
    freezingPendingKg100,
    missingCalendarDays,
    isWeekFullySquared,
    searchQuery,
    setSearchQuery,
    selectedDate,
    setSelectedDate,
    isWeekCloseOpen,
    setIsWeekCloseOpen,
    weekCloseError,
    confirmWeekClosure,
    handleSelectProcess,
    handleExportCsv,
  };
}
