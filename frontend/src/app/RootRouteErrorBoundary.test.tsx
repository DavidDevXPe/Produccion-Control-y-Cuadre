import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { RootRouteErrorBoundary } from './RootRouteErrorBoundary'

function renderFailingRoute(loader: () => unknown) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        loader,
        element: <p>Contenido recuperado</p>,
        HydrateFallback: () => <p>Cargando…</p>,
        errorElement: <RootRouteErrorBoundary />,
      },
    ],
    { initialEntries: ['/'] },
  )

  render(<RouterProvider router={router} />)
  return router
}

describe('RootRouteErrorBoundary', () => {
  it('shows a safe message for HTTP errors and a clear home action', async () => {
    renderFailingRoute(() => {
      throw new Response(null, { status: 403 })
    })

    expect(await screen.findByRole('heading', { name: 'No pudimos cargar esta pantalla' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No tienes permisos para acceder a esta pantalla.',
    )
    expect(screen.getByRole('alert')).not.toHaveTextContent('403')
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', expect.stringContaining('/'))
  })

  it('revalidates the failed route when retry is requested', async () => {
    let attempts = 0
    renderFailingRoute(() => {
      attempts += 1
      if (attempts === 1) throw new Response(null, { status: 503 })
      return null
    })

    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Intentar nuevamente' }))

    await waitFor(() => {
      expect(screen.getByText('Contenido recuperado')).toBeInTheDocument()
    })
    expect(attempts).toBe(2)
  })

  it('does not expose unexpected error details', async () => {
    renderFailingRoute(() => {
      throw new Error('internal database connection string')
    })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Se produjo un error inesperado.',
    )
    expect(screen.getByRole('alert')).not.toHaveTextContent('internal database connection string')
  })
})
