import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CatalogBenchmarksSection } from './CatalogBenchmarksSection'

describe('CatalogBenchmarksSection', () => {
  it('renders the family yield targets panel', () => {
    render(<CatalogBenchmarksSection />)

    expect(
      screen.getByRole('heading', { name: 'Metas de Rendimiento por Familia' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Aleta Cruda')).toBeInTheDocument()
    expect(screen.getByText('80.0%')).toBeInTheDocument()
    expect(screen.getByText('Rejos Crudo')).toBeInTheDocument()
    expect(screen.getByText('85.0%')).toBeInTheDocument()
  })

  it('renders the operational efficiency benchmarks panel', () => {
    render(<CatalogBenchmarksSection />)

    expect(
      screen.getByRole('heading', { name: 'Benchmarks de Eficiencia Operativa' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Línea Empaque (Directo)')).toBeInTheDocument()
    expect(screen.getByText('120 Kg / persona-h')).toBeInTheDocument()
    expect(screen.getByText('Línea Congelado (Túneles)')).toBeInTheDocument()
    expect(screen.getByText('150 Kg / persona-h')).toBeInTheDocument()
  })
})
