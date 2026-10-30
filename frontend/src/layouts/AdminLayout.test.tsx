import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { AdminLayout } from './AdminLayout'
import { ProductionDataProvider } from '../features/production/state/ProductionDataContext'
import { DAYS_STORAGE_KEY } from '../features/production/state/productionDataConstants'

describe('AdminLayout theme preference', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.classList.add('dark')
  })

  afterEach(() => {
    document.documentElement.classList.remove('dark')
  })

  it('switches between dark and light and persists the choice', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<div>Contenido</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getAllByText('David Castillo')).toHaveLength(2)
    expect(screen.getAllByText('Administrativo')).toHaveLength(2)
    expect(
      screen.getAllByRole('img', { name: 'Avatar de David Castillo' }),
    ).toHaveLength(2)
    expect(screen.queryByText('Usuario local')).not.toBeInTheDocument()
    expect(screen.queryByText('PRODUCCIÓN')).not.toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Cambiar a tema claro' })[0]!)

    await waitFor(() => {
      expect(document.documentElement).not.toHaveClass('dark')
      expect(window.localStorage.getItem('trabunda-color-theme')).toBe('light')
    })

    fireEvent.click(screen.getAllByRole('button', { name: 'Cambiar a tema oscuro' })[0]!)

    await waitFor(() => {
      expect(document.documentElement).toHaveClass('dark')
      expect(window.localStorage.getItem('trabunda-color-theme')).toBe('dark')
    })
  })

  it('displays offline banner and reconnected banner during connectivity transitions', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<div>Contenido</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.queryByText(/Modo Sin Conexión/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Conexión restablecida/)).not.toBeInTheDocument()

    fireEvent(window, new Event('offline'))

    expect(
      screen.getByText(/Modo Sin Conexión \(PWA activo\)/),
    ).toBeInTheDocument()

    fireEvent(window, new Event('online'))

    await waitFor(() => {
      expect(screen.queryByText(/Modo Sin Conexión/)).not.toBeInTheDocument()
      expect(
        screen.getByText(/Conexión restablecida: trabajando en línea con almacenamiento sincronizado\./),
      ).toBeInTheDocument()
    })
  })

  it('shows and dismisses the external-update notice after another tab changes journeys', () => {
    render(
      <ProductionDataProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<AdminLayout />}>
              <Route index element={<div>Contenido</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ProductionDataProvider>,
    )

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: DAYS_STORAGE_KEY,
          newValue: '[]',
        }),
      )
    })

    expect(
      screen.getByText(/Se actualizaron datos desde otra pestaña/),
    ).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Cerrar aviso de actualización externa',
      }),
    )
    expect(
      screen.queryByText(/Se actualizaron datos desde otra pestaña/),
    ).not.toBeInTheDocument()
  })
})
