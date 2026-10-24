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
import type { ProductionDay, ProductionDayCalculation } from "../model/types";
import { getJourneyStatus } from "../presentation/journeyStatus";
import { useProductionData } from "../state/ProductionDataContext";

type ProductionDayJourney = ReturnType<typeof getJourneyStatus>;

function getProductionDayStatusBadge({
  isClosed,
  hasVisibleClosureObservations,
  isBalanced,
  isReadyToClose,
  hasClosureWarnings,
  journey,
}: {
  isClosed: boolean
  hasVisibleClosureObservations: boolean
  isBalanced: boolean
  isReadyToClose: boolean
  hasClosureWarnings: boolean
  journey: ProductionDayJourney | undefined
}) {
  if (isClosed) {
    if (hasVisibleClosureObservations) {
      return { tone: "warning" as const, label: "CERRADA · CON OBSERVACIONES" };
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

  return journey
    ? { tone: journey.tone, label: journey.label }
    : { tone: "neutral" as const, label: "EN CURSO" };
}

function buildFreezingCloseSummary(
  productionDay: ProductionDay,
  calculation: ProductionDayCalculation,
  totalFrozenKg100: number,
) {
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
    { label: "Total congelado", value: formatCentiKg(totalFrozenKg100) },
    {
      label: "Con origen identificado",
      value: formatCentiKg(calculation.processedPreviousBalanceKg100),
    },
    {
      label: "Sin origen suficiente",
      value: formatCentiKg(calculation.reportOwnProductionKg100),
    },
  ];
}

function buildPackingCloseSummary(
  productionDay: ProductionDay,
  calculation: ProductionDayCalculation,
  isReadyToClose: boolean,
  hasClosureWarnings: boolean,
) {
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
}

function resolveProductionDay(
  date: string | undefined,
  requestedProcess: ReturnType<typeof getProductionProcess> | undefined,
  allProductionDays: readonly ProductionDay[],
  findProductionDay: (
    date: string,
    process?: ReturnType<typeof getProductionProcess>,
  ) => ProductionDay | undefined,
) {
  if (!date) return undefined
  return (
    findProductionDay(date, requestedProcess) ??
    (!requestedProcess
      ? allProductionDays.find((day) => day.date === date)
      : undefined)
  )
}

function getProductionDayFlags(
  operationalState: ReturnType<typeof getProductionDayOperationalState> | undefined,
) {
  return {
    isBalanced: operationalState?.isBalanced ?? false,
    isClosed: operationalState?.lifecycle === 'CLOSED',
    isReadyToClose: operationalState?.state === 'READY_TO_CLOSE',
    hasClosureWarnings: (operationalState?.validation.warnings.length ?? 0) > 0,
  }
}

function getVisibleClosureObservations(
  productionDay: ProductionDay | undefined,
  operationalState: ReturnType<typeof getProductionDayOperationalState> | undefined,
) {
  const historical = productionDay?.closureObservations ?? []
  return historical.length > 0
    ? historical
    : (operationalState?.validation.warnings ?? [])
}

function getBalancePositions(
  productionDay: ProductionDay | undefined,
  weeklyBalancePositions: ReturnType<typeof calculateOutstandingBalances>,
) {
  if (!productionDay) return []
  return weeklyBalancePositions.filter(
    (position) => position.originDayId === productionDay.id,
  )
}

function canExportProductionDay(
  productionDay: ProductionDay | undefined,
  calculation: ProductionDayCalculation | undefined,
  isBalanced: boolean,
) {
  return Boolean(
    productionDay &&
      productionDay.status === 'CLOSED' &&
      isBalanced &&
      calculation &&
      calculation.integrityIssues.length === 0,
  )
}

function getProductionJourney(
  productionDay: ProductionDay | undefined,
  operationalState: ReturnType<typeof getProductionDayOperationalState> | undefined,
) {
  if (!productionDay || !operationalState) return undefined
  return getJourneyStatus(productionDay, operationalState)
}

function getProductionDayModes(productionDay: ProductionDay | undefined) {
  return {
    isFreezing: productionDay ? isFreezingProductionDay(productionDay) : false,
    isBalanceOnly: productionDay
      ? isBalanceOnlyProductionDay(productionDay)
      : false,
  }
}

function canEditProductionDay(
  productionDay: ProductionDay | undefined,
  process: ReturnType<typeof getProductionProcess> | undefined,
  isClosed: boolean,
  isUserManagedDay: (date: string, process?: ReturnType<typeof getProductionProcess>) => boolean,
) {
  return Boolean(
    productionDay &&
      process &&
      isUserManagedDay(productionDay.date, process) &&
      !isClosed,
  )
}

interface ProductionDayActionsInput {
  readonly productionDay: ProductionDay | undefined
  readonly calculation: ProductionDayCalculation | undefined
  readonly operationalState: ReturnType<typeof getProductionDayOperationalState> | undefined
  readonly isReadyToClose: boolean
  readonly isClosed: boolean
  readonly canExport: boolean
  readonly allProductionDays: readonly ProductionDay[]
  readonly upsertProductionDay: (
    productionDay: ProductionDay,
    options?: { allowReplace?: boolean; previousDate?: string },
  ) => void
}

function useProductionDayActions({
  productionDay,
  calculation,
  operationalState,
  isReadyToClose,
  isClosed,
  canExport,
  allProductionDays,
  upsertProductionDay,
}: ProductionDayActionsInput) {
  const [exportState, setExportState] = useState<
    'IDLE' | 'EXPORTING' | 'SUCCESS' | 'ERROR'
  >('IDLE')
  const [isCloseConfirmationOpen, setIsCloseConfirmationOpen] = useState(false)
  const [closeError, setCloseError] = useState('')

  const handleCloseDay = () => {
    if (!isReadyToClose || isClosed) return
    setCloseError('')
    setIsCloseConfirmationOpen(true)
  }

  const cancelClose = () => {
    setIsCloseConfirmationOpen(false)
    setCloseError('')
  }

  const confirmCloseDay = () => {
    if (!productionDay || !operationalState || !isReadyToClose || isClosed) return

    try {
      upsertProductionDay(
        {
          ...productionDay,
          status: 'CLOSED',
          closureObservations: buildClosureObservations(
            operationalState.validation.warnings,
            new Date().toISOString(),
          ),
        },
        { allowReplace: true },
      )
      setIsCloseConfirmationOpen(false)
      setCloseError('')
    } catch (error) {
      setCloseError(
        error instanceof Error ? error.message : 'No se pudo cerrar la jornada.',
      )
    }
  }

  const handleExport = async () => {
    if (!productionDay || !calculation || !canExport || exportState === 'EXPORTING') return
    setExportState('EXPORTING')

    try {
      const { exportProductionDayWorkbook } = await import('../export/productionDayWorkbook')
      await exportProductionDayWorkbook(productionDay, calculation, {
        productionDays: allProductionDays,
      })
      setExportState('SUCCESS')
    } catch {
      setExportState('ERROR')
    }
  }

  return {
    exportState,
    isCloseConfirmationOpen,
    closeError,
    handleCloseDay,
    cancelClose,
    confirmCloseDay,
    handleExport,
  }
}

export function useProductionDayDetail() {
  const { date } = useParams<{ date?: string }>();
  const [searchParams] = useSearchParams();
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

  const productionDay = resolveProductionDay(
    date,
    requestedProcess,
    allProductionDays,
    findProductionDay,
  );

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
  const process = productionDay ? getProductionProcess(productionDay) : undefined;
  const { isFreezing, isBalanceOnly } = getProductionDayModes(productionDay);

  const weeklyBalancePositions = useMemo(() => {
    return calculateOutstandingBalances(
      allProductionDays,
      subsequentBalanceLots,
    );
  }, [allProductionDays, subsequentBalanceLots]);

  const balancePositions = useMemo(() => {
    return getBalancePositions(productionDay, weeklyBalancePositions);
  }, [weeklyBalancePositions, productionDay]);

  const { isBalanced, isClosed, isReadyToClose, hasClosureWarnings } =
    getProductionDayFlags(operationalState);
  const visibleClosureObservations = getVisibleClosureObservations(
    productionDay,
    operationalState,
  );
  const hasVisibleClosureObservations = visibleClosureObservations.length > 0;

  const canExport = canExportProductionDay(
    productionDay,
    calculation,
    isBalanced,
  );

  const sourceSheet =
    productionDay?.lines.at(0)?.source.sheet ?? "la hoja operativa";

  const journey = useMemo(() => {
    return getProductionJourney(productionDay, operationalState);
  }, [productionDay, operationalState]);

  const statusBadge = useMemo(
    () =>
      getProductionDayStatusBadge({
        isClosed,
        hasVisibleClosureObservations,
        isBalanced,
        isReadyToClose,
        hasClosureWarnings,
        journey,
      }),
    [
      isClosed,
      hasVisibleClosureObservations,
      isBalanced,
      isReadyToClose,
      hasClosureWarnings,
      journey,
    ],
  );

  const canEdit = canEditProductionDay(
    productionDay,
    process,
    isClosed,
    isUserManagedDay,
  );

  const {
    exportState,
    isCloseConfirmationOpen,
    closeError,
    handleCloseDay,
    cancelClose,
    confirmCloseDay,
    handleExport,
  } = useProductionDayActions({
    productionDay,
    calculation,
    operationalState,
    isReadyToClose,
    isClosed,
    canExport,
    allProductionDays,
    upsertProductionDay,
  })

  const totalFrozenKg100 = useMemo(() => {
    if (!calculation) return 0;
    return sumKg100([
      calculation.day.declaredReportedKg100,
      calculation.night.declaredReportedKg100,
    ]);
  }, [calculation]);

  const freezingCloseSummary = useMemo(() => {
    if (!productionDay || !calculation) return [];
    return buildFreezingCloseSummary(productionDay, calculation, totalFrozenKg100);
  }, [productionDay, calculation, totalFrozenKg100]);

  const packingCloseSummary = useMemo(() => {
    if (!productionDay || !calculation) return [];
    return buildPackingCloseSummary(
      productionDay,
      calculation,
      isReadyToClose,
      hasClosureWarnings,
    );
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
