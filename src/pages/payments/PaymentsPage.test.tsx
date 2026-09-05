import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/msw/server'
import { createTestQueryClient } from '../../test/renderWithProviders'
import { PaymentsPage } from './PaymentsPage'
import { periodFrom } from './periodFrom'
import { paymentKeys } from '../../api/payments'

let client: QueryClient
let paymentsCalls: number

function Wrapped() {
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/abonnements']}>
        <PaymentsPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  client = createTestQueryClient()
  paymentsCalls = 0
  server.use(
    http.get('/api/v1/admin/payments', () => {
      paymentsCalls++
      return HttpResponse.json({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 1 })
    }),
    http.get('/api/v1/admin/subscriptions/stats', () => HttpResponse.json({})),
  )
})

afterEach(() => {
  vi.useRealTimers()
})

describe('PaymentsPage (régression F-01 — boucle infinie sur /abonnements)', () => {
  it("n'émet qu'une seule requête au montage, stable même après des re-rendus sans changement de filtre", async () => {
    const { rerender } = render(<Wrapped />)

    await screen.findByText('Aucune transaction')
    expect(paymentsCalls).toBe(1)

    // Re-rendus « externes » (ex. un parent qui re-rend) sans toucher aux
    // filtres : ne doit jamais redéclencher /admin/payments.
    rerender(<Wrapped />)
    rerender(<Wrapped />)
    rerender(<Wrapped />)

    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(paymentsCalls).toBe(1)
  })
})

describe('paymentKeys.list (contrat de queryKey stable)', () => {
  it('produit la même clé pour deux objets filtres value-equal mais de référence différente', () => {
    const a = paymentKeys.list({ method: 'ORANGE_MONEY', status: 'SUCCESS', page: 0, size: 20 })
    const b = paymentKeys.list({ method: 'ORANGE_MONEY', status: 'SUCCESS', page: 0, size: 20 })
    expect(a).toEqual(b)
  })

  it('normalise les valeurs par défaut : {} équivaut à {page:0,size:20,...null}', () => {
    expect(paymentKeys.list({})).toEqual(
      paymentKeys.list({ page: 0, size: 20, from: undefined, to: undefined, method: undefined, status: undefined, sort: undefined }),
    )
  })
})

describe('periodFrom (troncature à la journée)', () => {
  it('renvoie la même chaîne pour deux appels dans la même journée civile', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-12T08:00:00Z'))
    const first = periodFrom('30')
    vi.setSystemTime(new Date('2026-06-12T21:45:00Z'))
    const second = periodFrom('30')
    expect(first).toBe(second)
  })

  it("renvoie undefined pour la période 'all'", () => {
    expect(periodFrom('all')).toBeUndefined()
  })
})
