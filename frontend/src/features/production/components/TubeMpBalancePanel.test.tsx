import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { kg100 } from '../model/calculations'
import type { TubeMpBalance } from '../model/tubeMpBalance'
import { TubeMpBalancePanel } from './TubeMpBalancePanel'

describe('TubeMpBalancePanel', () => {
  function createSampleBalance(
    overrides: Partial<TubeMpBalance> = {},
  ): TubeMpBalance {
    return {
      mpTotalKg100: kg100(1000000), // 10,000 kg
      mpTubeKg100: kg100(500000), // 5,000 kg
      ptMantoKg100: kg100(160000), // 1,600 kg
      mantoStandardYield: 0.8,
      mpMantoEstimatedKg100: kg100(200000), // 2,000 kg
      mpAnillaProcessKg100: kg100(300000), // 3,000 kg
      ptAnillasKg100: kg100(110000), // 1,100 kg
      mpAnillaPolarEstimatedKg100: kg100(50000),
      mpAnillaGeneralEstimatedKg100: kg100(100000),
      mpAnillaUsaEstimatedKg100: kg100(50000),
      mpMainAnillasEstimatedKg100: kg100(200000),
      mpAnillasUnallocatedKg100: kg100(100000),
      mpMantoExcessKg100: kg100(0),
      mpMainAnillasExcessKg100: kg100(0),
      unclassifiedAnillasKg100: kg100(0),
      tubeDifferenceKg100: kg100(0),
      processOutputs: {
        mainAnillasKg100: kg100(110000),
        botonKg100: kg100(15000),
        recorteKg100: kg100(12000),
        membranasKg100: kg100(8000),
        otherCoproductsKg100: kg100(0),
        coproductsTotalKg100: kg100(35000),
        processOutputsTotalKg100: kg100(145000),
      },
      ...overrides,
    }
  }

  it('renders nothing when mpTotalKg100 is 0', () => {
    const balance = createSampleBalance({ mpTotalKg100: kg100(0) })
    const { container } = render(<TubeMpBalancePanel balance={balance} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when both ptMantoKg100 and ptAnillasKg100 are 0', () => {
    const balance = createSampleBalance({
      ptMantoKg100: kg100(0),
      ptAnillasKg100: kg100(0),
    })
    const { container } = render(<TubeMpBalancePanel balance={balance} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders section card, success badge, and primary metric cards when balanced', () => {
    const balance = createSampleBalance()
    render(<TubeMpBalancePanel balance={balance} />)

    expect(screen.getByRole('heading', { name: 'Balance MP Tubo' })).toBeInTheDocument()
    expect(screen.getByText('BALANCE TUBO 0.00 KG')).toBeInTheDocument()
    expect(screen.getByText('MP Tubo')).toBeInTheDocument()
    expect(screen.getByText('MP estimada Manto')).toBeInTheDocument()
    expect(screen.getByText('MP proceso Anillas')).toBeInTheDocument()
    expect(screen.getByText('Diferencia balance Tubo')).toBeInTheDocument()
  })

  it('renders technical details of Anillas and process output positions', () => {
    const balance = createSampleBalance()
    render(<TubeMpBalancePanel balance={balance} />)

    expect(screen.getByText('Detalle técnico de Anillas')).toBeInTheDocument()
    expect(screen.getByText('Polar · 36%')).toBeInTheDocument()
    expect(screen.getByText('Generales · 42%')).toBeInTheDocument()
    expect(screen.getByText('USA · 34%')).toBeInTheDocument()
    expect(screen.getByText('MP principal explicada')).toBeInTheDocument()
    expect(screen.getByText('MP técnica por distribuir')).toBeInTheDocument()

    expect(screen.getByText('Salidas del proceso de Anillas')).toBeInTheDocument()
    expect(screen.getByText('Anillas principales')).toBeInTheDocument()
    expect(screen.getByText('Botón')).toBeInTheDocument()
    expect(screen.getByText('Recorte de Anillas')).toBeInTheDocument()
    expect(screen.getByText('Membranas')).toBeInTheDocument()
  })

  it('renders explanation when unallocated anillas MP exists', () => {
    const balance = createSampleBalance({
      mpAnillasUnallocatedKg100: kg100(50000),
    })
    render(<TubeMpBalancePanel balance={balance} />)

    expect(
      screen.getByText(
        /La MP técnica por distribuir pertenece al proceso global de Anillas/i,
      ),
    ).toBeInTheDocument()
  })

  it('renders integrity alert and messages when errors are detected', () => {
    const balance = createSampleBalance({
      mpMantoExcessKg100: kg100(25000), // 250 kg
      mpMainAnillasExcessKg100: kg100(15000), // 150 kg
      unclassifiedAnillasKg100: kg100(5000), // 50 kg
      tubeDifferenceKg100: kg100(40000), // 400 kg
    })
    render(<TubeMpBalancePanel balance={balance} />)

    expect(screen.getByText('REVISAR INTEGRIDAD')).toBeInTheDocument()
    expect(
      screen.getByText(/Manto requiere 250.00 kg más que la MP Tubo disponible/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Las Anillas principales requieren un exceso de 150.00 kg/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Hay 50.00 kg sin clasificación técnica Polar, General o USA/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/El balance principal del Tubo presenta una diferencia de 400.00 kg/i),
    ).toBeInTheDocument()
  })
})
