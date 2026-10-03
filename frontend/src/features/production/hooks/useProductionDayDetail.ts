import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { usePageTitle } from "../../../hooks/usePageTitle";
import { formatCentiKg, formatIsoDate } from "../../../utils/formatters";
import { calculateOutstandingBalances, sumKg100 } from "../model/calculations";
import { buildClosureObservations } from "../model/closureObservations";
import { isBalanceOnlyProductionDay } from "../model/productionDayMode";
import { getProductionDayOperationalState } from "../model/productionLifecycle";
import {
  getProductionProcess,
  isFreezingProductionDay,
  isProductionProcess,
} from "../model/productionProcess";
import { getJourneyStatus } from "../presentation/journeyStatus";
import { useProductionData } from "../state/ProductionDataContext";

export function useProductionDayDetail() {
  const { date } = useParams<{ date?: string }>();
  const [searchParams] = useSearchParams();
  const [exportState, setExportState] = useState<
    "IDLE" | "EXPORTING" | "SUCCESS" | "ERROR"
  >("IDLE");
  const [isCloseConfirmationOpen, setIsCloseConfirmationOpen] = useState(false);
  const [closeError, setCloseError] = useState("");

  const {
    allProductionDays,
    subsequentBalanceLots,
    findProductionDay,
    isUserManagedDay,
    upsertProductionDay,
  } = useProductionData();

  const processParam = searchParams.get("process");
  const requestedProcess = isProductionProcess(processParam)
    ? processParam
    : undefined;

  const productionDay = date
    ? findProductionDay(date, requestedProcess)
    : undefined;

  usePageTitle(
    productionDay
      ? `Detalle del ${productionDay.displayName}`
      : "Jornada no encontrada",
  );

  const operationalState = useMemo(() => {
    return productionDay
      ? getProductionDayOperationalState(productionDay)
      : undefined;
  }, [productionDay]);

  const calculation = operationalState?.calculation;
  const process = productionDay
    ? getProductionProcess(productionDay)
    : undefined;
  const isFreezing = productionDay
    ? isFreezingProductionDay(productionDay)
    : false;
  const isBalanceOnly = productionDay
    ? isBalanceOnlyProductionDay(productionDay)
    : false;

  const weeklyBalancePositions = useMemo(() => {
    return calculateOutstandingBalances(
      allProductionDays,
      subsequentBalanceLots,
    );
  }, [allProductionDays, subsequentBalanceLots]);

  const balancePositions = useMemo(() => {
    if (!productionDay) return [];
    return weeklyBalancePositions.filter(
      (position) => position.originDayId === productionDay.id,
    );
  }, [weeklyBalancePositions, productionDay]);

  const isBalanced = operationalState?.isBalanced ?? false;
  const isClosed = operationalState?.lifecycle === "CLOSED";
  const isReadyToClose = operationalState?.state === "READY_TO_CLOSE";
  const hasClosureWarnings =
    (operationalState?.validation.warnings.length ?? 0) > 0;

  const historicalClosureObservations =
    productionDay?.closureObservations ?? [];
  const visibleClosureObservations =
    historicalClosureObservations.length > 0
      ? historicalClosureObservations
      : (operationalState?.validation.warnings ?? []);
  const hasVisibleClosureObservations = visibleClosureObservations.length > 0;

  const canExport = Boolean(
    productionDay &&
    productionDay.status === "CLOSED" &&
    isBalanced &&
    calculation &&
    calculation.integrityIssues.length === 0,
  );

  const sourceSheet =
    productionDay?.lines.at(0)?.source.sheet ?? "la hoja operativa";

  const journey = useMemo(() => {
    if (!productionDay || !operationalState) return undefined;
    return getJourneyStatus(productionDay, operationalState);
  }, [productionDay, operationalState]);

  const statusBadge = useMemo(() => {
    if (isClosed) {
      if (hasVisibleClosureObservations) {
        return {
          tone: "warning" as const,
          label: "CERRADA · CON OBSERVACIONES",
        };
      }
      if (isBalanced) {
        return { tone: "success" as const, label: "CERRADA · SOLO LECTURA" };
      }
      return { tone: "danger" as const, label: "CERRADA · REVISAR" };
    }

    if (isReadyToClose) {
      if (hasClosureWarnings) {
        return { tone: "warning" as const, label: "LISTA · CON OBSERVACIONES" };
      }
      return { tone: "success" as const, label: "LISTA PARA CERRAR" };
    }

    if (journey) {
      return { tone: journey.tone, label: journey.label };
    }

    return { tone: "neutral" as const, label: "EN CURSO" };
  }, [
    isClosed,
    hasVisibleClosureObservations,
    isBalanced,
    isReadyToClose,
    hasClosureWarnings,
    journey,
  ]);

  const canEdit = Boolean(
    productionDay &&
    process &&
    isUserManagedDay(productionDay.date, process) &&
    !isClosed,
  );

  const handleCloseDay = () => {
    if (!isReadyToClose || isClosed) return;
    setCloseError("");
    setIsCloseConfirmationOpen(true);
  };

  const cancelClose = () => {
    setIsCloseConfirmationOpen(false);
    setCloseError("");
  };

  const confirmCloseDay = () => {
    if (!productionDay || !operationalState || !isReadyToClose || isClosed)
      return;

    try {
      upsertProductionDay(
        {
          ...productionDay,
          status: "CLOSED",
          closureObservations: buildClosureObservations(
            operationalState.validation.warnings,
            new Date().toISOString(),
          ),
        },
        {
          allowReplace: true,
        },
      );

      setIsCloseConfirmationOpen(false);
      setCloseError("");
    } catch (error) {
      setCloseError(
        error instanceof Error
          ? error.message
          : "No se pudo cerrar la jornada.",
      );
    }
  };

  const handleExport = async () => {
    if (
      !productionDay ||
      !calculation ||
      !canExport ||
      exportState === "EXPORTING"
    )
      return;

    setExportState("EXPORTING");

    try {
      const { exportProductionDayWorkbook } =
        await import("../export/productionDayWorkbook");
      await exportProductionDayWorkbook(productionDay, calculation, {
        productionDays: allProductionDays,
      });
      setExportState("SUCCESS");
    } catch {
      setExportState("ERROR");
    }
  };

  const totalFrozenKg100 = useMemo(() => {
    if (!calculation) return 0;
    return sumKg100([
      calculation.day.declaredReportedKg100,
      calculation.night.declaredReportedKg100,
    ]);
  }, [calculation]);

  const freezingCloseSummary = useMemo(() => {
    if (!productionDay || !calculation) return [];
    return [
      { label: "Fecha", value: formatIsoDate(productionDay.date) },
      {
        label: "Congelado Día",
        value: formatCentiKg(calculation.day.declaredReportedKg100),
      },
      {
        label: "Congelado Noche",
        value: formatCentiKg(calculation.night.declaredReportedKg100),
      },
      {
        label: "Total congelado",
        value: formatCentiKg(totalFrozenKg100),
      },
      {
        label: "Con origen identificado",
        value: formatCentiKg(calculation.processedPreviousBalanceKg100),
      },
      {
        label: "Sin origen suficiente",
        value: formatCentiKg(calculation.reportOwnProductionKg100),
      },
    ];
  }, [productionDay, calculation, totalFrozenKg100]);

  const packingCloseSummary = useMemo(() => {
    if (!productionDay || !calculation) return [];
    return [
      { label: "Fecha", value: formatIsoDate(productionDay.date) },
      {
        label: "Materia prima",
        value: formatCentiKg(productionDay.declaredRawMaterialKg100),
      },
      {
        label: "Producto terminado",
        value: formatCentiKg(calculation.declaredFinishedKg100),
      },
      {
        label: "Saldo final",
        value: formatCentiKg(calculation.newClosingBalanceKg100),
      },
      {
        label: "Diferencia",
        value: formatCentiKg(calculation.differenceKg100),
      },
      {
        label: "Estado",
        value: isReadyToClose
          ? hasClosureWarnings
            ? "Lista para cerrar con observación"
            : "Lista para cerrar"
          : "Requiere revisión",
      },
    ];
  }, [productionDay, calculation, isReadyToClose, hasClosureWarnings]);

  return {
    productionDay,
    allProductionDays,
    operationalState,
    calculation,
    process,
    isFreezing,
    isBalanceOnly,
    balancePositions,
    isBalanced,
    isClosed,
    isReadyToClose,
    hasClosureWarnings,
    visibleClosureObservations,
    hasVisibleClosureObservations,
    canExport,
    sourceSheet,
    statusBadge,
    canEdit,
    exportState,
    isCloseConfirmationOpen,
    closeError,
    handleCloseDay,
    cancelClose,
    confirmCloseDay,
    handleExport,
    totalFrozenKg100,
    freezingCloseSummary,
    packingCloseSummary,
  };
}
