import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { getOperationalWeekContextForIsoDate } from "../../../utils/operationalContext";
import { exportPageToPdf } from "../../../utils/pdfExport";
import { getProductionProcess } from "../../production/model/productionProcess";
import type { ProductionProcess } from "../../production/model/types";
import { useProductionData } from "../../production/state/ProductionDataContext";
import { exportPerformanceWorkbook } from "../export/performanceWorkbook";
import { usePerformanceRecords } from "./usePerformanceRecords";
import {
  aggregatePerformanceRecords,
  applyWeeklyShiftBenchmarks,
  calculatePerformanceRecord,
} from "../model/performanceCalculations";
import { PERFORMANCE_BENCHMARKS } from "../model/performanceConfig";

export type PerformanceView = "SUMMARY" | ProductionProcess;

export function isPerformanceView(
  value: string | null,
): value is PerformanceView {
  return value === "SUMMARY" || value === "PACKING" || value === "FREEZING";
}

export function useOperationalPerformanceData() {
  usePageTitle("Rendimiento operativo");

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get("view");
  const view: PerformanceView = isPerformanceView(requestedView)
    ? requestedView
    : "SUMMARY";

  const { activeWeekNumber, allProductionDays, getWeekView } =
    useProductionData();
  const { records: storedRecords, saveRecord } = usePerformanceRecords();

  const period = useMemo(() => {
    return getOperationalWeekContextForIsoDate(
      getWeekView(activeWeekNumber, "PACKING").period.startDate,
    ).period;
  }, [getWeekView, activeWeekNumber]);

  const productionDays = useMemo(() => {
    return allProductionDays.filter(
      (day) => day.date >= period.startDate && day.date <= period.endDate,
    );
  }, [allProductionDays, period]);

  const calculatedRecords = useMemo(
    () =>
      applyWeeklyShiftBenchmarks(
        storedRecords.flatMap((record) => {
          const productionDay = allProductionDays.find(
            (day) =>
              day.id === record.productionDayId &&
              getProductionProcess(day) === record.process,
          );
          return productionDay
            ? [
                calculatePerformanceRecord(
                  record,
                  productionDay,
                  PERFORMANCE_BENCHMARKS,
                ),
              ]
            : [];
        }),
      ),
    [allProductionDays, storedRecords],
  );

  const weekRecords = useMemo(() => {
    return calculatedRecords.filter(
      (record) => record.weekNumber === activeWeekNumber,
    );
  }, [calculatedRecords, activeWeekNumber]);

  const weekAggregate = useMemo(() => {
    return aggregatePerformanceRecords(weekRecords);
  }, [weekRecords]);

  const selectedProcess: ProductionProcess | null =
    view === "SUMMARY" ? null : view;

  const selectedDays = useMemo(() => {
    return selectedProcess
      ? productionDays.filter(
          (day) => getProductionProcess(day) === selectedProcess,
        )
      : [];
  }, [selectedProcess, productionDays]);

  const handleViewChange = (nextView: PerformanceView) => {
    setSearchParams({ view: nextView }, { replace: true });
  };

  const handleExportExcel = () => {
    exportPerformanceWorkbook(activeWeekNumber, weekRecords);
  };

  const handleExportPdf = () => {
    exportPageToPdf(`Rendimiento Operativo Semana ${activeWeekNumber}`);
  };

  return {
    view,
    activeWeekNumber,
    storedRecords,
    saveRecord,
    calculatedRecords,
    weekRecords,
    weekAggregate,
    selectedProcess,
    selectedDays,
    handleViewChange,
    handleExportExcel,
    handleExportPdf,
  };
}
