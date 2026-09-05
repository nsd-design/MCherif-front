import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

/*
 * Même logique de retry-skip-4xx que `src/app/queryClient.ts`, mais retry
 * forcé à `false` en test : un retry 5xx réel introduirait un délai de
 * backoff non déterministe dans les assertions.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  })
}

interface RenderOptions {
  route?: string
  queryClient?: QueryClient
}

export function renderWithProviders(ui: ReactElement, { route = '/', queryClient }: RenderOptions = {}) {
  const client = queryClient ?? createTestQueryClient()
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}
