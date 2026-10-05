import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import {
  summarizeDashboardAttention,
  type DashboardAttentionItem,
} from '../presentation/dashboardAttention'
import { DashboardAttentionCard } from './DashboardAttentionCard'

describe('DashboardAttentionCard', () => {
  const createItem = (
    overrides?: Partial<DashboardAttentionItem>,
  ): DashboardAttentionItem => ({
    key: 'item-1',
    tone: 'danger',
    title: 'Descuadre en Envasado',
    date: '2026-09-18',
    process: 'PACKING',
    description: 'Diferencia detectada de 15.5 kg respecto a balance.',
    to: '/jornadas/2026-09-18?process=PACKING',
    ...overrides,
  })

  it('renders empty state when there are no attention items', () => {
    const summary = summarizeDashboardAttention([])

    render(
      <MemoryRouter>
        <DashboardAttentionCard attentionItems={[]} attention={summary} />
      </MemoryRouter>,
    )

    expect(screen.getByText('Alertas y excepciones')).toBeInTheDocument()
    expect(screen.getByText('SIN ALERTAS')).toBeInTheDocument()
    expect(
      screen.getByText(
        'No hay observaciones ni validaciones bloqueantes detectadas.',
      ),
    ).toBeInTheDocument()
  })

  it('renders critical items with critical badge and danger tone styles', () => {
    const item1 = createItem({
      key: 'item-1',
      tone: 'danger',
      title: 'Error crítico en Envasado',
    })
    const item2 = createItem({
      key: 'item-2',
      tone: 'danger',
      title: 'Validación bloqueada',
      date: '2026-09-19',
      process: 'FREEZING',
      description: 'Lotes sin origen especificado',
    })

    const items = [item1, item2]
    const summary = summarizeDashboardAttention(items)

    render(
      <MemoryRouter>
        <DashboardAttentionCard
          attentionItems={items}
          attention={summary}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('2 CRÍTICAS')).toBeInTheDocument()
    expect(screen.getByText('Error crítico en Envasado')).toBeInTheDocument()
    expect(screen.getByText('Validación bloqueada')).toBeInTheDocument()
    expect(screen.getByText('Envasado')).toBeInTheDocument()
    expect(screen.getByText('Congelamiento')).toBeInTheDocument()
  })

  it('renders singular critical badge for 1 critical item', () => {
    const item = createItem({ tone: 'danger' })
    const items = [item]
    const summary = summarizeDashboardAttention(items)

    render(
      <MemoryRouter>
        <DashboardAttentionCard
          attentionItems={items}
          attention={summary}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('1 CRÍTICA')).toBeInTheDocument()
  })

  it('renders warning and info items with process mapping and observation counts', () => {
    const warningItem = createItem({
      key: 'warn-1',
      tone: 'warning',
      title: 'Cierre con notas',
      process: null,
      description: 'Observaciones registradas por supervisor',
    })
    const infoItem: DashboardAttentionItem = {
      key: 'info-1',
      tone: 'info',
      title: 'Saldo en tránsito',
      process: 'FREEZING',
      date: '2026-09-18',
      description: 'Cámaras con producto pendiente de ingreso',
    }

    const items = [warningItem, infoItem]
    const summary = summarizeDashboardAttention(items)

    render(
      <MemoryRouter>
        <DashboardAttentionCard
          attentionItems={items}
          attention={summary}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('2 OBSERVACIONES')).toBeInTheDocument()
    expect(screen.getByText('Cierre con notas')).toBeInTheDocument()
    expect(screen.getByText('Envasado → Congelamiento')).toBeInTheDocument()
    expect(screen.getByText('Saldo en tránsito')).toBeInTheDocument()
    expect(screen.getByText('Congelamiento')).toBeInTheDocument()

    const reviewLinks = screen.getAllByRole('link', { name: /Revisar:/i })
    expect(reviewLinks).toHaveLength(2)
  })

  it('renders singular observation badge when there is 1 non-critical observation', () => {
    const warning = createItem({
      key: 'warn-1',
      tone: 'warning',
      title: 'Obs 1',
    })

    const items = [warning]
    const summary = summarizeDashboardAttention(items)

    render(
      <MemoryRouter>
        <DashboardAttentionCard
          attentionItems={items}
          attention={summary}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('1 OBSERVACIÓN')).toBeInTheDocument()
  })

  it('renders hidden items footer and count when hiddenCount > 0', () => {
    const items = [
      createItem({ key: '1' }),
      createItem({ key: '2' }),
      createItem({ key: '3' }),
      createItem({ key: '4' }),
      createItem({ key: '5' }),
      createItem({ key: '6' }),
    ]
    const summary = summarizeDashboardAttention(items, 5)

    render(
      <MemoryRouter>
        <DashboardAttentionCard
          attentionItems={items}
          attention={summary}
        />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('Hay 1 evento adicional de la semana.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver todas/i })).toBeInTheDocument()
  })

  it('renders plural hidden items message when hiddenCount is > 1', () => {
    const items = [
      createItem({ key: '1' }),
      createItem({ key: '2' }),
      createItem({ key: '3' }),
      createItem({ key: '4' }),
    ]
    const summary = summarizeDashboardAttention(items, 2)

    render(
      <MemoryRouter>
        <DashboardAttentionCard
          attentionItems={items}
          attention={summary}
        />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('Hay 2 eventos adicionales de la semana.'),
    ).toBeInTheDocument()
  })
})
