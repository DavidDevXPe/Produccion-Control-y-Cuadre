import { useMemo, useState, type ChangeEvent, type Dispatch, type SetStateAction } from 'react'
import {
  buildFreezingExcelPreview,
  isTreatmentOnlyProduct,
  type FreezingExcelPreview,
} from '../capture/freezingExcelPreview'
import type { ParsedPackingReportImport } from '../capture/parseProductionWorkbook'
import type { ProductionCatalogItem } from '../capture/productionCatalog'
import { captureQuantityKg100 } from '../capture/productionEntryHelpers'
import type {
  ProductionCaptureDraft,
  ProductionCaptureRow,
} from '../capture/productionCapture'
import {
  addActiveProduct,
  addAliasToActiveProduct,
  createStableProductId,
  getActiveProducts,
} from '../capture/productCatalogRepository'
import { normalizeProductName } from '../capture/productNormalizer'
import { formatCentiKg } from '../../../utils/formatters'

export interface UseProductionExcelImportOptions {
  readonly draft: ProductionCaptureDraft
  readonly setDraft: Dispatch<SetStateAction<ProductionCaptureDraft>>
  readonly isFreezing: boolean
  readonly catalogItems: readonly ProductionCatalogItem[]
  readonly setCatalogItems: Dispatch<SetStateAction<ProductionCatalogItem[]>>
  readonly setSaveError: (error: string) => void
}

export function useProductionExcelImport({
  draft,
  setDraft,
  isFreezing,
  catalogItems,
  setCatalogItems,
  setSaveError,
}: UseProductionExcelImportOptions) {
  const [excelPreview, setExcelPreview] =
    useState<ParsedPackingReportImport | null>(null)
  const [freezingExcelPreview, setFreezingExcelPreview] =
    useState<FreezingExcelPreview | null>(null)
  const [excelShift, setExcelShift] = useState<'DAY' | 'NIGHT'>('DAY')
  const [fileName, setFileName] = useState('')
  const [importState, setImportState] = useState<
    'IDLE' | 'READING' | 'READY' | 'ERROR'
  >('IDLE')
  const [excelImportMessage, setExcelImportMessage] = useState('')
  const [excelExistingProductByRow, setExcelExistingProductByRow] = useState<
    Record<number, string>
  >({})
  const [freezingNewProductFamilyByRow, setFreezingNewProductFamilyByRow] =
    useState<Record<number, string>>({})

  const freezingCatalogFamilyOptions = useMemo(() => {
    const families = new Map<
      string,
      Pick<
        ProductionCatalogItem,
        'familyId' | 'familyName' | 'summaryGroupId'
      >
    >()

    for (const product of catalogItems) {
      if (
        product.active === false ||
        isTreatmentOnlyProduct(product)
      ) {
        continue
      }

      if (!families.has(product.familyId)) {
        families.set(product.familyId, {
          familyId: product.familyId,
          familyName: product.familyName,
          summaryGroupId: product.summaryGroupId,
        })
      }
    }

    // NUCA BIKINI puede aparecer en reportes de Congelamiento aunque
    // todavía no exista como producto activo en el catálogo semilla.
    if (!families.has('nuca-bikini')) {
      families.set('nuca-bikini', {
        familyId: 'nuca-bikini',
        familyName: 'NUCA BIKINI',
        summaryGroupId: 'NUCA_BIKINI',
      })
    }

    return Array.from(families.values()).sort((first, second) =>
      first.familyName.localeCompare(second.familyName, 'es-PE'),
    )
  }, [catalogItems])

  const handleWorkbook = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]

    if (!file) return

    setImportState('READING')
    setFileName(file.name)
    setSaveError('')
    setExcelImportMessage('')
    setExcelExistingProductByRow({})
    setFreezingNewProductFamilyByRow({})
    setExcelPreview(null)
    setFreezingExcelPreview(null)

    try {
      const buffer = await file.arrayBuffer()

      if (isFreezing) {
        const { parseFreezingWorkbook } = await import(
          '../capture/parseFreezingWorkbook'
        )

        const parsed = await parseFreezingWorkbook(buffer)

        const preview = buildFreezingExcelPreview(
          parsed,
          file.name,
          excelShift,
          catalogItems,
        )

        setFreezingExcelPreview(preview)
        setImportState('READY')
        return
      }

      const { parseProductionWorkbook } = await import(
        '../capture/parseProductionWorkbook'
      )

      const preview = await parseProductionWorkbook(buffer, {
        fileName: file.name,
        operationalDate: draft.date,
        shift: excelShift,
      })

      setExcelPreview(preview)
      setImportState('READY')
    } catch (error) {
      setExcelPreview(null)
      setFreezingExcelPreview(null)

      setSaveError(
        error instanceof Error
          ? error.message
          : `ARCHIVO NO COMPATIBLE. No se pudo leer el Excel de ${
              isFreezing ? 'Congelamiento' : 'Envasado'
            }.`,
      )

      setImportState('ERROR')
    } finally {
      event.target.value = ''
    }
  }

  const changeExcelShift = (shift: 'DAY' | 'NIGHT') => {
    setExcelShift(shift)
    setExcelPreview(null)
    setFreezingExcelPreview(null)
    setFileName('')
    setImportState('IDLE')
    setExcelImportMessage('')
    setExcelExistingProductByRow({})
    setFreezingNewProductFamilyByRow({})
    setSaveError('')
  }

  const unresolvedExcelRows =
    excelPreview?.rows.filter(
      (row) =>
        row.totalKg > 0 &&
        (row.status === 'NUEVO PRODUCTO' ||
          row.status === 'REQUIERE REVISIÓN' ||
          row.status === 'FECHA REQUIERE REVISIÓN'),
    ) ?? []

  const unresolvedFreezingExcelRows =
    freezingExcelPreview?.rows.filter(
      (row) => row.totalKg > 0 && row.status === 'REQUIERE REVISIÓN',
    ) ?? []

  const canConfirmExcelImport = isFreezing
    ? Boolean(
        freezingExcelPreview &&
          freezingExcelPreview.status === 'EXCEL RECONCILIADO' &&
          unresolvedFreezingExcelRows.length === 0,
      )
    : Boolean(
        excelPreview &&
          excelPreview.status !== 'ARCHIVO NO COMPATIBLE' &&
          unresolvedExcelRows.length === 0,
      )

  const resolveExcelRowWithProduct = (
    rowNumber: number,
    product: ProductionCatalogItem,
    status: 'COINCIDENCIA EXACTA' | 'ALIAS CONOCIDO',
    matchReason?: string,
  ) => {
    setExcelPreview((current) => {
      if (!current) return current
      const rows = current.rows.map((row) =>
        row.rowNumber === rowNumber
          ? {
              ...row,
              product,
              status,
              matchKind:
                status === 'ALIAS CONOCIDO'
                  ? ('ALIAS' as const)
                  : ('EXACT' as const),
              matchReason,
            }
          : row,
      )
      const newRows = rows.filter((row) => row.status === 'NUEVO PRODUCTO').length
      const normalizedRows = rows.filter(
        (row) => row.status === 'COINCIDENCIA NORMALIZADA',
      ).length
      const aliasRows = rows.filter(
        (row) => row.status === 'ALIAS CONOCIDO',
      ).length
      const reviewRows =
        rows.filter(
          (row) =>
            row.totalKg > 0 &&
            (row.status === 'NUEVO PRODUCTO' ||
              row.status === 'REQUIERE REVISIÓN' ||
              row.status === 'FECHA REQUIERE REVISIÓN'),
        ).length + current.ignoredRows.length

      return {
        ...current,
        rows,
        newRows,
        normalizedRows,
        aliasRows,
        reviewRows,
        recognizedRows:
          rows.length -
          newRows -
          rows.filter((row) => row.status === 'FECHA REQUIERE REVISIÓN').length,
        status:
          reviewRows === 0 && current.warnings.length === 0
            ? 'EXCEL RECONCILIADO'
            : 'EXCEL REQUIERE REVISIÓN',
      }
    })
  }

  const addExcelRowToCatalog = (rowNumber: number) => {
    const row = excelPreview?.rows.find(
      (candidate) => candidate.rowNumber === rowNumber,
    )
    if (!row?.product) return
    const confirmed = addActiveProduct({
      ...row.product,
      productName: row.product.canonicalName ?? row.product.productName,
      canonicalName: row.product.canonicalName ?? row.product.productName,
      active: true,
      source: 'MANUAL',
    })
    setCatalogItems(getActiveProducts())
    resolveExcelRowWithProduct(rowNumber, confirmed, 'COINCIDENCIA EXACTA')
  }

  const associateExcelRowToExisting = (rowNumber: number) => {
    const productId = excelExistingProductByRow[rowNumber]
    const row = excelPreview?.rows.find(
      (candidate) => candidate.rowNumber === rowNumber,
    )
    const product = catalogItems.find(
      (candidate) => candidate.productId === productId,
    )
    if (!row || !product) return
    addAliasToActiveProduct(product.productId, row.rawProductName)
    setCatalogItems(getActiveProducts())
    resolveExcelRowWithProduct(
      rowNumber,
      {
        ...product,
        aliases: [
          ...new Set([...(product.aliases ?? []), row.rawProductName]),
        ],
      },
      'ALIAS CONOCIDO',
      'Alias confirmado manualmente',
    )
  }

  const associateFreezingExcelRowToExisting = (rowNumber: number) => {
    const productId = excelExistingProductByRow[rowNumber]

    const product = catalogItems.find(
      (candidate) => candidate.productId === productId,
    )

    const row = freezingExcelPreview?.rows.find(
      (candidate) => candidate.rowNumber === rowNumber,
    )

    if (!row || !product) return

    addAliasToActiveProduct(product.productId, row.baseProductName)

    setCatalogItems(getActiveProducts())

    setFreezingExcelPreview((current) => {
      if (!current) {
        return current
      }

      const rows = current.rows.map((candidate) =>
        candidate.rowNumber === rowNumber
          ? {
              ...candidate,
              product: {
                ...product,
                aliases: [
                  ...new Set([
                    ...(product.aliases ?? []),
                    row.baseProductName,
                  ]),
                ],
              },
              status: 'ALIAS CONOCIDO' as const,
              matchReason: 'Asociación confirmada manualmente.',
            }
          : candidate,
      )

      const reviewRows = rows.filter(
        (candidate) =>
          candidate.totalKg > 0 &&
          candidate.status === 'REQUIERE REVISIÓN',
      ).length

      const recognizedRows = rows.length - reviewRows

      return {
        ...current,
        rows,
        reviewRows,
        recognizedRows,
        status:
          current.reconciled && reviewRows === 0
            ? 'EXCEL RECONCILIADO'
            : 'EXCEL REQUIERE REVISIÓN',
      }
    })
  }

  const addFreezingExcelRowToCatalog = (rowNumber: number) => {
    const row = freezingExcelPreview?.rows.find(
      (candidate) => candidate.rowNumber === rowNumber,
    )

    if (!row) return

    const familyId = freezingNewProductFamilyByRow[rowNumber]
    const family = freezingCatalogFamilyOptions.find(
      (candidate) => candidate.familyId === familyId,
    )

    if (!family) {
      setSaveError(
        'Selecciona la familia del producto antes de agregarlo al catálogo.',
      )
      return
    }

    const canonicalName = row.baseProductName.replace(/\s+/g, ' ').trim()
    const normalizedName = normalizeProductName(canonicalName)

    const existingProduct = catalogItems.find(
      (candidate) =>
        candidate.active !== false &&
        normalizeProductName(
          candidate.canonicalName ?? candidate.productName,
        ) === normalizedName,
    )

    const confirmedProduct =
      existingProduct ??
      addActiveProduct({
        familyId: family.familyId,
        familyName: family.familyName,
        productId: createStableProductId(canonicalName),
        productName: canonicalName,
        canonicalName,
        normalizedName,
        aliases: [],
        source: 'MANUAL',
        createdAt: new Date().toISOString(),
        active: true,
        summaryGroupId: family.summaryGroupId,
        technicalClassification: canonicalName.includes('ANILLAS')
          ? canonicalName.includes('POLAR')
            ? 'POLAR'
            : canonicalName.includes('USA')
              ? 'USA'
              : 'GENERAL'
          : 'UNCLASSIFIED',
      })

    setCatalogItems(getActiveProducts())

    setFreezingExcelPreview((current) => {
      if (!current) return current

      const rows = current.rows.map((candidate) =>
        candidate.rowNumber === rowNumber
          ? {
              ...candidate,
              product: confirmedProduct,
              status: 'COINCIDENCIA EXACTA' as const,
              matchReason: existingProduct
                ? 'Producto existente recuperado durante la revisión.'
                : 'Producto agregado manualmente al catálogo durante la importación.',
            }
          : candidate,
      )

      const productiveRows = rows.filter((candidate) => candidate.totalKg > 0)

      const reviewRows = productiveRows.filter(
        (candidate) => candidate.status === 'REQUIERE REVISIÓN',
      ).length

      const recognizedRows = productiveRows.filter(
        (candidate) =>
          candidate.product !== null &&
          candidate.status !== 'REQUIERE REVISIÓN',
      ).length

      return {
        ...current,
        rows,
        reviewRows,
        recognizedRows,
        status:
          current.reconciled && reviewRows === 0
            ? 'EXCEL RECONCILIADO'
            : 'EXCEL REQUIERE REVISIÓN',
      }
    })

    setFreezingNewProductFamilyByRow((current) => {
      const next = { ...current }
      delete next[rowNumber]
      return next
    })

    setExcelExistingProductByRow((current) => {
      const next = { ...current }
      delete next[rowNumber]
      return next
    })

    setSaveError('')
  }

  const applyFreezingExcelPreview = () => {
    if (!freezingExcelPreview) {
      return
    }

    if (freezingExcelPreview.status !== 'EXCEL RECONCILIADO') {
      setSaveError('El Excel de Congelamiento todavía requiere revisión.')
      return
    }

    if (unresolvedFreezingExcelRows.length > 0) {
      setSaveError(
        `${unresolvedFreezingExcelRows.length} producto(s) requieren revisión antes de importar.`,
      )
      return
    }

    const shiftHasData = draft.rows.some((row) =>
      freezingExcelPreview.shift === 'DAY'
        ? captureQuantityKg100(row.dayReportedKg) > 0
        : captureQuantityKg100(row.nightReportedKg) > 0,
    )

    if (
      shiftHasData &&
      !window.confirm(
        `Este turno ya contiene información.\n\nLa importación reemplazará únicamente el Turno ${
          freezingExcelPreview.shift === 'DAY' ? 'Día' : 'Noche'
        }.`,
      )
    ) {
      return
    }

    const totalsByProduct = new Map<
      string,
      {
        product: ProductionCatalogItem
        totalKg: number
      }
    >()

    for (const row of freezingExcelPreview.rows) {
      if (!row.product || row.totalKg <= 0) {
        continue
      }

      const existing = totalsByProduct.get(row.product.productId)

      totalsByProduct.set(row.product.productId, {
        product: row.product,
        totalKg: (existing?.totalKg ?? 0) + row.totalKg,
      })
    }

    setDraft((current) => {
      const importedShift = freezingExcelPreview.shift

      const nextRows = current.rows.map((row) => {
        const imported = totalsByProduct.get(row.product.productId)

        return {
          ...row,
          ...(importedShift === 'DAY'
            ? {
                dayReportedKg: imported ? String(imported.totalKg) : '0',
              }
            : {
                nightReportedKg: imported ? String(imported.totalKg) : '0',
              }),
        }
      })

      for (const [productId, imported] of totalsByProduct) {
        const exists = nextRows.some(
          (row) => row.product.productId === productId,
        )

        if (exists) {
          continue
        }

        const row: ProductionCaptureRow = {
          key: `excel-freezing-${productId}-${Date.now()}-${nextRows.length}`,
          product: imported.product,
          dayReportedKg:
            importedShift === 'DAY' ? String(imported.totalKg) : '0',
          dayPreviousBalanceKg: '0',
          nightReportedKg:
            importedShift === 'NIGHT' ? String(imported.totalKg) : '0',
          nightPreviousBalanceKg: '0',
          tunnelDayKg: '0',
          tunnelNightKg: '0',
          treatmentKg: '0',
          closingBalanceKg: '0',
          finishedKg: '',
        }

        nextRows.push(row)
      }

      const nextBalanceUses = current.balanceUses.map((balance) =>
        importedShift === 'DAY'
          ? {
              ...balance,
              dayKg: '0',
            }
          : {
              ...balance,
              nightKg: '0',
            },
      )

      return {
        ...current,
        source: 'EXCEL',
        sourceSheet: freezingExcelPreview.sheetName,
        shiftAllocationMode: 'EXPLICIT',
        rows: nextRows,
        balanceUses: nextBalanceUses,
        ...(importedShift === 'DAY'
          ? {
              declaredDayTotalKg: String(freezingExcelPreview.totalKg),
            }
          : {
              declaredNightTotalKg: String(freezingExcelPreview.totalKg),
            }),
      }
    })

    setExcelImportMessage(
      `Turno ${
        freezingExcelPreview.shift === 'DAY' ? 'Día' : 'Noche'
      } importado: ${freezingExcelPreview.totalAros.toLocaleString(
        'es-PE',
      )} aros = ${freezingExcelPreview.totalKg.toLocaleString('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} kg. Revisa la vinculación FIFO antes de cerrar.`,
    )

    setSaveError('')
  }

  const applyExcelPreview = async () => {
    if (isFreezing) {
      applyFreezingExcelPreview()
      return
    }

    if (!excelPreview || excelPreview.status === 'ARCHIVO NO COMPATIBLE') {
      return
    }

    const shiftHasData = draft.rows.some((row) =>
      excelPreview.shift === 'DAY'
        ? captureQuantityKg100(row.dayReportedKg) > 0
        : captureQuantityKg100(row.nightReportedKg) > 0,
    )
    if (
      shiftHasData &&
      !window.confirm(
        `Este turno ya contiene información.\n\nLa importación reemplazará únicamente el Turno ${
          excelPreview.shift === 'DAY' ? 'Día' : 'Noche'
        }.`,
      )
    ) {
      return
    }
    const { mergePackingReportIntoDraft } = await import(
      '../capture/parseProductionWorkbook'
    )
    setDraft((current) => mergePackingReportIntoDraft(current, excelPreview))
    setExcelImportMessage(
      `Turno ${
        excelPreview.shift === 'DAY' ? 'Día' : 'Noche'
      } importado: ${formatCentiKg(
        captureQuantityKg100(String(excelPreview.reconstructedTotalKg)),
      )}. Revisa el cuadre antes de guardar.`,
    )
    setSaveError('')
  }

  const resetExcelImport = () => {
    setExcelPreview(null)
    setFreezingExcelPreview(null)
    setFileName('')
    setImportState('IDLE')
    setExcelImportMessage('')
    setExcelExistingProductByRow({})
    setFreezingNewProductFamilyByRow({})
  }

  return {
    excelPreview,
    freezingExcelPreview,
    excelShift,
    fileName,
    importState,
    excelImportMessage,
    excelExistingProductByRow,
    freezingNewProductFamilyByRow,
    freezingCatalogFamilyOptions,
    unresolvedExcelRows,
    unresolvedFreezingExcelRows,
    canConfirmExcelImport,
    changeExcelShift,
    handleWorkbook,
    applyExcelPreview,
    addExcelRowToCatalog,
    associateExcelRowToExisting,
    addFreezingExcelRowToCatalog,
    associateFreezingExcelRowToExisting,
    setExcelExistingProductByRow,
    setFreezingNewProductFamilyByRow,
    resetExcelImport,
  }
}
