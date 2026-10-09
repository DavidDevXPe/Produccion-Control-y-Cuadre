import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { FreezingOriginLedgerRow } from '../capture/freezingOriginLedger'
import {
  createEmptyCaptureDraft,
  type ProductionCaptureDraft,
} from '../capture/productionCapture'
import { PRODUCTION_CATALOG_ITEMS } from '../capture/productionCatalog'
import { kg100 } from '../model/calculations'
import type { OutstandingBalancePosition } from '../model/types'
import {
  ProductionBalancesSection,
  type ProductionBalancesSectionProps,
} from './ProductionBalancesSection'

describe('ProductionBalancesSection', () => {
  const sampleCatalogItem = PRODUCTION_CATALOG_ITEMS[0]!

  const sampleAvailableBalance: OutstandingBalancePosition = {
    originDayId: 'day-2026-09-15',
    originDate: '2026-09-15',
    familyId: sampleCatalogItem.familyId,
    familyName: sampleCatalogItem.familyName,
    productId: sampleCatalogItem.productId,
    productName: sampleCatalogItem.productName,
    generatedKg100: kg100(150000),
    processedDayKg100: kg100(0),
    processedNightKg100: kg100(0),
    processedTotalKg100: kg100(0),
    pendingKg100: kg100(150000),
    excessKg100: kg100(0),
  }

  const sampleBalanceUse = {
    key: 'balance-use-1',
    originDayId: 'day-2026-09-15',
    originDate: '2026-09-15',
    originDisplayName: 'Martes 15',
    originProcess: 'PACKING' as const,
    productId: sampleCatalogItem.productId,
    productName: sampleCatalogItem.productName,
    familyId: sampleCatalogItem.familyId,
    familyName: sampleCatalogItem.familyName,
    availableKg100: kg100(150000),
    dayKg: '500',
    nightKg: '200',
    totalKg100: kg100(70000),
    remainingKg100: kg100(80000),
  }

  const sampleExplanation = {
    selectedAvailableKg100: kg100(150000),
    pendingInSelectedKg100: kg100(80000),
    untouchedKg100: kg100(0),
    untracedFrozenKg100: kg100(0),
    physicalDifferenceKg100: kg100(0),
    untouchedPositions: [],
  }

  const sampleTraceabilitySummary = {
    totalProducts: 1,
    traceableProducts: 1,
    pendingProducts: 0,
    problemProducts: 0,
    tracedKg100: kg100(70000),
    reportedKg100: kg100(70000),
    pendingKg100: kg100(0),
    excessLinkedKg100: kg100(0),
  }

  const sampleLedgerRow: FreezingOriginLedgerRow = {
    originDayId: 'day-2026-09-15',
    originDate: '2026-09-15',
    productCount: 1,
    generatedKg100: kg100(150000),
    frozenBeforeCurrentKg100: kg100(0),
    frozenCurrentKg100: kg100(70000),
    frozenAccumulatedKg100: kg100(70000),
    pendingKg100: kg100(80000),
    excessKg100: kg100(0),
    completionPercent: 46.67,
    status: 'PENDING',
  }

  function createProps(
    overrides: Partial<ProductionBalancesSectionProps> = {},
  ): ProductionBalancesSectionProps {
    const draft: ProductionCaptureDraft = {
      ...createEmptyCaptureDraft('2026-09-16', 'PACKING'),
      balanceUses: [sampleBalanceUse],
    }

    return {
      isFreezing: false,
      isBalanceOnly: false,
      usesExternalAvailability: false,
      reportsReconciled: true,
      totalReportedKg100: kg100(70000),
      draft,
      availableBalances: [sampleAvailableBalance],
      freezingPreviousOriginsAvailableKg100: kg100(150000),
      freezingCurrentOriginAvailableKg100: kg100(0),
      freezingTotalAvailableKg100: kg100(150000),
      freezingLinkedThisDayKg100: kg100(70000),
      freezingPendingAfterKg100: kg100(80000),
      freezingBalanceExplanation: sampleExplanation,
      freezingPendingLinkCount: 0,
      freezingTraceabilitySummary: sampleTraceabilitySummary,
      freezingOriginLedger: [sampleLedgerRow],
      freezingAutomaticOriginStartDate: '2026-09-10',
      selectedProcess: 'PACKING',
      freezingBalanceUseSummary: null,
      balanceShiftDiagnostics: [],
      catalogItems: PRODUCTION_CATALOG_ITEMS,
      onOpenBulkFreezingLink: vi.fn(),
      onAddBalance: vi.fn(),
      onRemoveBalanceUse: vi.fn(),
      onDistributeLegacyBalance: vi.fn(),
      onUpdateBalanceUse: vi.fn(),
      ...overrides,
    }
  }

  it('renders standard packing title and description when isFreezing is false', () => {
    const props = createProps()
    render(<ProductionBalancesSection {...props} />)

    expect(
      screen.getByRole('heading', { name: 'Saldos anteriores procesados' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Si el proceso lo permite, añade saldos de jornadas previas para cuadrar la producción reportada.',
      ),
    ).toBeInTheDocument()
  })

  it('renders freezing title, description, and freezing widgets when isFreezing is true', () => {
    const props = createProps({
      isFreezing: true,
      selectedProcess: 'FREEZING',
      freezingPendingLinkCount: 2,
    })
    render(<ProductionBalancesSection {...props} />)

    expect(
      screen.getByRole('heading', {
        name: 'Saldos pendientes de congelar',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        /Registra los saldos de Envasado de jornadas anteriores que se congelan en esta jornada/i,
      ),
    ).toBeInTheDocument()

    // Bulk link banner appears when freezingPendingLinkCount > 0
    expect(screen.getByText('Vinculación FIFO disponible')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Vincular todos FIFO' }),
    ).toBeInTheDocument()
  })

  it('disables the fieldset when reports are not reconciled and no external availability', () => {
    const props = createProps({
      reportsReconciled: false,
      usesExternalAvailability: false,
    })
    render(<ProductionBalancesSection {...props} />)

    const fieldset = screen.getByRole('group', {
      name: 'Consumo de saldos anteriores',
    })
    expect(fieldset).toBeDisabled()
  })

  it('renders empty message when balanceUses is empty for non-freezing', () => {
    const props = createProps({
      draft: {
        ...createEmptyCaptureDraft('2026-09-16', 'PACKING'),
        balanceUses: [],
      },
    })
    render(<ProductionBalancesSection {...props} />)

    expect(
      screen.getByText('No se han asignado saldos de jornadas anteriores.'),
    ).toBeInTheDocument()
  })

  it('renders empty message when balanceUses is empty for freezing', () => {
    const props = createProps({
      isFreezing: true,
      draft: {
        ...createEmptyCaptureDraft('2026-09-16', 'FREEZING'),
        balanceUses: [],
      },
    })
    render(<ProductionBalancesSection {...props} />)

    expect(
      screen.getByText('No se ha vinculado producto disponible desde Envasado.'),
    ).toBeInTheDocument()
  })

  it('renders balance row and triggers onUpdateBalanceUse on shift input change', () => {
    const onUpdateBalanceUse = vi.fn()
    const props = createProps({ onUpdateBalanceUse })
    render(<ProductionBalancesSection {...props} />)

    expect(
      screen.getByText(
        `${sampleCatalogItem.familyName} · ${sampleCatalogItem.productName}`,
      ),
    ).toBeInTheDocument()

    const dayInput = screen.getByLabelText(/Procesado Día/i)
    fireEvent.change(dayInput, { target: { value: '600' } })

    expect(onUpdateBalanceUse).toHaveBeenCalledWith(
      'balance-use-1',
      'dayKg',
      '600',
    )
  })

  it('triggers onRemoveBalanceUse when delete button is clicked', () => {
    const onRemoveBalanceUse = vi.fn()
    const props = createProps({ onRemoveBalanceUse })
    render(<ProductionBalancesSection {...props} />)

    const removeBtn = screen.getByRole('button', {
      name: `Quitar saldo de ${sampleCatalogItem.productName}`,
    })
    fireEvent.click(removeBtn)

    expect(onRemoveBalanceUse).toHaveBeenCalledWith('balance-use-1')
  })

  it('triggers onAddBalance when selecting from ProductPicker', () => {
    const onAddBalance = vi.fn()
    const props = createProps({ onAddBalance })
    render(<ProductionBalancesSection {...props} />)

    const input = screen.getByRole('combobox', {
      name: 'Saldo pendiente disponible',
    })
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'aleta' } })

    const option = screen.getByRole('option', {
      name: new RegExp(sampleCatalogItem.productName, 'i'),
    })
    fireEvent.click(option)

    expect(onAddBalance).toHaveBeenCalledWith(sampleAvailableBalance)
  })

  it('triggers onOpenBulkFreezingLink when clicking the bulk link banner button', () => {
    const onOpenBulkFreezingLink = vi.fn()
    const props = createProps({
      isFreezing: true,
      freezingPendingLinkCount: 3,
      onOpenBulkFreezingLink,
    })
    render(<ProductionBalancesSection {...props} />)

    const bulkBtn = screen.getByRole('button', {
      name: 'Vincular todos FIFO',
    })
    fireEvent.click(bulkBtn)

    expect(onOpenBulkFreezingLink).toHaveBeenCalled()
  })
})
