import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as backupService from '../backup/backupService'
import { DataBackupsPage } from './DataBackupsPage'

const quarantineKey = 'trabunda-storage-quarantine-v1'

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

describe('data and backups page', () => {
  it('shows nothing about set-aside data when nothing was set aside', () => {
    render(<DataBackupsPage />)

    expect(
      screen.queryByRole('heading', { name: 'Datos apartados por seguridad' }),
    ).not.toBeInTheDocument()
  })

  it('tells the user what was set aside, keeps it, and lets them export it', () => {
    window.localStorage.setItem(
      quarantineKey,
      JSON.stringify([
        {
          sourceKey: 'trabunda-production-days-v2',
          reason: 'INVALID_RECORD',
          quarantinedAt: '2026-09-23T10:00:00.000Z',
          payload: [{ id: 'a' }, { id: 'b' }],
        },
        {
          sourceKey: 'trabunda-production-days-v2',
          reason: 'INVALID_JSON',
          quarantinedAt: '2026-09-23T10:05:00.000Z',
          payload: '[{"id":',
        },
      ]),
    )
    const download = vi
      .spyOn(backupService, 'downloadJsonFile')
      .mockImplementation(() => undefined)

    render(<DataBackupsPage />)

    const section = screen
      .getByRole('heading', { name: 'Datos apartados por seguridad' })
      .closest('section')!
    expect(within(section).getByText('Registros con estructura inválida')).toBeInTheDocument()
    expect(within(section).getByText(/2 elementos/)).toBeInTheDocument()
    expect(within(section).getByText('Datos ilegibles (JSON dañado)')).toBeInTheDocument()
    expect(within(section).getByText(/1 elemento ·/)).toBeInTheDocument()
    // Read-only: the page offers no way to delete what was set aside.
    expect(within(section).queryByRole('button', { name: /borrar|eliminar|limpiar/i })).toBeNull()

    fireEvent.click(within(section).getByRole('button', { name: 'Exportar datos apartados' }))

    expect(download).toHaveBeenCalledTimes(1)
    expect(download.mock.calls[0]?.[0]).toMatch(/^trabunda-datos-apartados-/)
    expect(download.mock.calls[0]?.[1]).toHaveLength(2)
    expect(window.localStorage.getItem(quarantineKey)).not.toBeNull()
  })
})
