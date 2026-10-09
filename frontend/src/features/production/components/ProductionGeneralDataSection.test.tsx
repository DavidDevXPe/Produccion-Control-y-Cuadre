import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  createEmptyCaptureDraft,
  type ProductionCaptureDraft,
} from '../capture/productionCapture'
import { ExcelImportedBalancesAlert } from './generalData/ExcelImportedBalancesAlert'
import { GeneralInputsGrid } from './generalData/GeneralInputsGrid'
import { SecondaryCaptureControls } from './generalData/SecondaryCaptureControls'
import { SundayOperationBanner } from './generalData/SundayOperationBanner'
import {
  ProductionGeneralDataSection,
  type ProductionGeneralDataSectionProps,
} from './ProductionGeneralDataSection'

describe('ProductionGeneralDataSection', () => {
  function createProps(
    overrides: Partial<ProductionGeneralDataSectionProps> = {},
  ): ProductionGeneralDataSectionProps {
    const defaultDraft: ProductionCaptureDraft = {
      ...createEmptyCaptureDraft('2026-09-16', 'PACKING'),
      rawMaterialKg: '10000',
      declaredDayTotalKg: '6000',
      declaredNightTotalKg: '4000',
    }

    return {
      draft: defaultDraft,
      isSunday: false,
      isFreezing: false,
      isBalanceOnly: false,
      activeWeekStartDate: '2026-09-14',
      activeWeekEndDate: '2026-09-20',
      usesExternalAvailability: false,
      totalReportedKg100: 1000000,
      tunnelToggleError: null,
      importedBalanceMatches: true,
      importedBalanceTotal: 0,
      newClosingBalanceKg100: 0,
      onUpdateDraft: vi.fn(),
      onUpdateDate: vi.fn(),
      onUpdateTunnelCondition: vi.fn(),
      ...overrides,
    }
  }

  it('renders section title and manual capture description', () => {
    const props = createProps()
    render(<ProductionGeneralDataSection {...props} />)

    expect(screen.getByText('Datos generales')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Totales independientes usados para validar el cuadre y el aprovechamiento.',
      ),
    ).toBeInTheDocument()
  })

  it('renders excel preview description when draft source is EXCEL', () => {
    const excelDraft: ProductionCaptureDraft = {
      ...createEmptyCaptureDraft('2026-09-16', 'PACKING'),
      source: 'EXCEL',
      sourceSheet: 'MIÉRCOLES 16',
    }
    const props = createProps({ draft: excelDraft })
    render(<ProductionGeneralDataSection {...props} />)

    expect(
      screen.getByText(
        'Vista previa de MIÉRCOLES 16; todos los campos siguen siendo editables antes de guardar.',
      ),
    ).toBeInTheDocument()
  })

  it('renders SundayOperationBanner when isSunday is true', () => {
    const props = createProps({ isSunday: true })
    render(<ProductionGeneralDataSection {...props} />)

    expect(screen.getByText(/DOMINGO ·/i)).toBeInTheDocument()
  })

  describe('SundayOperationBanner', () => {
    it('shows balance-only banner and allows toggling to normal production', () => {
      const onUpdateDraft = vi.fn()
      render(
        <SundayOperationBanner
          isFreezing={false}
          isBalanceOnly={true}
          onUpdateDraft={onUpdateDraft}
        />,
      )

      expect(screen.getByText(/PROCESAMIENTO DE SALDOS/i)).toBeInTheDocument()
      const checkbox = screen.getByRole('checkbox', {
        name: /Hubo descarga \/ producción nueva el domingo/i,
      })
      expect(checkbox).not.toBeChecked()

      fireEvent.click(checkbox)
      expect(onUpdateDraft).toHaveBeenCalledWith('operationMode', 'NORMAL')
    })

    it('shows freezing banner and hides checkbox when isFreezing is true', () => {
      render(
        <SundayOperationBanner
          isFreezing={true}
          isBalanceOnly={true}
          onUpdateDraft={vi.fn()}
        />,
      )

      expect(
        screen.getByText(/CONGELAMIENTO DE PENDIENTES/i),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('checkbox', {
          name: /Hubo descarga \/ producción nueva el domingo/i,
        }),
      ).not.toBeInTheDocument()
    })
  })

  describe('GeneralInputsGrid', () => {
    it('updates date and draft fields on user change', () => {
      const onUpdateDate = vi.fn()
      const onUpdateDraft = vi.fn()
      const draft = createEmptyCaptureDraft('2026-09-16', 'PACKING')

      render(
        <GeneralInputsGrid
          draft={draft}
          isFreezing={false}
          activeWeekStartDate="2026-09-14"
          activeWeekEndDate="2026-09-20"
          usesExternalAvailability={false}
          totalReportedKg100={1000000}
          onUpdateDate={onUpdateDate}
          onUpdateDraft={onUpdateDraft}
        />,
      )

      const dateInput = screen.getByDisplayValue('2026-09-16')
      fireEvent.change(dateInput, { target: { value: '2026-09-17' } })
      expect(onUpdateDate).toHaveBeenCalledWith('2026-09-17')

      const rawMaterialInput = screen.getByLabelText(/Materia prima/i)
      fireEvent.change(rawMaterialInput, { target: { value: '15000' } })
      expect(onUpdateDraft).toHaveBeenCalledWith('rawMaterialKg', '15000')

      expect(screen.getByText('Total reportado')).toBeInTheDocument()
      expect(screen.getByText(/10[.,]000[.,]00 kg/i)).toBeInTheDocument()
    })

    it('allows editing date within active week bounds', () => {
      const draft = createEmptyCaptureDraft('2026-09-16', 'PACKING')
      const onUpdateDate = vi.fn()
      render(
        <GeneralInputsGrid
          draft={draft}
          isFreezing={false}
          activeWeekStartDate="2026-09-14"
          activeWeekEndDate="2026-09-20"
          usesExternalAvailability={false}
          totalReportedKg100={0}
          onUpdateDate={onUpdateDate}
          onUpdateDraft={vi.fn()}
        />,
      )

      const input = screen.getByDisplayValue('2026-09-16')
      expect(input).toBeEnabled()
      expect(input).toHaveAttribute('min', '2026-09-14')
      expect(input).toHaveAttribute('max', '2026-09-20')
    })

    it('hides raw material and labels total as Total congelado in FREEZING', () => {
      const draft = createEmptyCaptureDraft('2026-09-16', 'FREEZING')
      render(
        <GeneralInputsGrid
          draft={draft}
          isFreezing={true}
          activeWeekStartDate="2026-09-14"
          activeWeekEndDate="2026-09-20"
          usesExternalAvailability={true}
          totalReportedKg100={500000}
          onUpdateDate={vi.fn()}
          onUpdateDraft={vi.fn()}
        />,
      )

      expect(screen.queryByLabelText(/Materia prima/i)).not.toBeInTheDocument()
      expect(screen.getByText('Total congelado')).toBeInTheDocument()
    })
  })

  describe('SecondaryCaptureControls', () => {
    it('renders informative message when usesExternalAvailability is true', () => {
      const draft = createEmptyCaptureDraft('2026-09-16', 'FREEZING')
      render(
        <SecondaryCaptureControls
          draft={draft}
          isFreezing={true}
          usesExternalAvailability={true}
          tunnelToggleError={null}
          onUpdateDraft={vi.fn()}
          onUpdateTunnelCondition={vi.fn()}
        />,
      )

      expect(
        screen.getByText(
          /Congelamiento no recibe nueva MP anatómica. La validación usa reportes físicos y disponibilidad trazable desde Envasado./i,
        ),
      ).toBeInTheDocument()
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    })

    it('allows toggling Nuca wash confirmation and Tunnel condition in normal mode', () => {
      const onUpdateDraft = vi.fn()
      const onUpdateTunnelCondition = vi.fn()
      const draft = createEmptyCaptureDraft('2026-09-16', 'PACKING')

      render(
        <SecondaryCaptureControls
          draft={draft}
          isFreezing={false}
          usesExternalAvailability={false}
          tunnelToggleError="No puedes desactivar el túnel con movimientos registrados."
          onUpdateDraft={onUpdateDraft}
          onUpdateTunnelCondition={onUpdateTunnelCondition}
        />,
      )

      const nucaCheckbox = screen.getByRole('checkbox', {
        name: /Existe pedido confirmado para lavado de Nuca Bikini/i,
      })
      fireEvent.click(nucaCheckbox)
      expect(onUpdateDraft).toHaveBeenCalledWith('nucaWashConfirmed', true)

      const tunnelCheckbox = screen.getByRole('checkbox', {
        name: /Existe producto para Túnel/i,
      })
      fireEvent.click(tunnelCheckbox)
      expect(onUpdateTunnelCondition).toHaveBeenCalledWith(true)

      expect(
        screen.getByText(
          'No puedes desactivar el túnel con movimientos registrados.',
        ),
      ).toBeInTheDocument()
    })

    it('renders reference input when nucaWashConfirmed is true', () => {
      const onUpdateDraft = vi.fn()
      const draft: ProductionCaptureDraft = {
        ...createEmptyCaptureDraft('2026-09-16', 'PACKING'),
        nucaWashConfirmed: true,
        nucaWashReference: 'PED-4521',
      }

      render(
        <SecondaryCaptureControls
          draft={draft}
          isFreezing={false}
          usesExternalAvailability={false}
          tunnelToggleError={null}
          onUpdateDraft={onUpdateDraft}
          onUpdateTunnelCondition={vi.fn()}
        />,
      )

      const referenceInput = screen.getByDisplayValue('PED-4521')
      fireEvent.change(referenceInput, { target: { value: 'PED-9999' } })
      expect(onUpdateDraft).toHaveBeenCalledWith(
        'nucaWashReference',
        'PED-9999',
      )
    })
  })

  describe('ExcelImportedBalancesAlert', () => {
    it('returns null when importedBalances is empty', () => {
      const draft = createEmptyCaptureDraft('2026-09-16', 'PACKING')
      const { container } = render(
        <ExcelImportedBalancesAlert
          draft={draft}
          importedBalanceMatches={true}
          importedBalanceTotal={0}
          newClosingBalanceKg100={0}
        />,
      )
      expect(container.firstChild).toBeNull()
    })

    it('renders alert when importedBalances are present', () => {
      const draft: ProductionCaptureDraft = {
        ...createEmptyCaptureDraft('2026-09-16', 'PACKING'),
        importedBalances: [
          { label: 'Saldo Aleta', kg: 1500 },
          { label: 'Saldo Manto', kg: 2500 },
        ],
      }

      render(
        <ExcelImportedBalancesAlert
          draft={draft}
          importedBalanceMatches={false}
          importedBalanceTotal={400000}
          newClosingBalanceKg100={100000}
        />,
      )

      expect(
        screen.getByText(/Saldos detectados en el Excel:/i),
      ).toBeInTheDocument()
      expect(screen.getByText(/Saldo Aleta: 1[.,]500[.,]00 kg/i)).toBeInTheDocument()
      expect(screen.getByText(/Saldo Manto: 2[.,]500[.,]00 kg/i)).toBeInTheDocument()
    })
  })
})
