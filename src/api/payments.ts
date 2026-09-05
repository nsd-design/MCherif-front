/*
 * Hooks Paiements & abonnements (TanStack Query) + export CSV (flux binaire).
 */
import { useQuery } from '@tanstack/react-query'
import { api, toApiError, unwrap } from './http'
import type { PaymentMethod, PaymentStatus } from './types'

export interface PaymentFilters {
  from?: string
  to?: string
  method?: PaymentMethod
  status?: PaymentStatus
  page?: number
  size?: number
  /** Tri Spring `'champ,desc'`. Champs de l'entité Payment uniquement :
   *  `createdAt`, `planCode`, `method`, `amountGnf`, `status`, `reference`.
   *  `userPhone` vient d'une jointure et n'est pas triable. */
  sort?: string
}

/*
 * Clé normalisée : champs primitifs explicites et ordonnés, avec les MÊMES
 * valeurs par défaut que la requête HTTP ci-dessous. Sérialiser l'objet brut
 * exposerait la clé à tout champ ajouté par un appelant, et ferait diverger
 * `{ page: undefined }` de `{ page: 0 }` alors que la requête est identique.
 */
export const paymentKeys = {
  all: ['payments'] as const,
  list: (f: PaymentFilters) =>
    [
      'payments',
      'list',
      f.from ?? null,
      f.to ?? null,
      f.method ?? null,
      f.status ?? null,
      f.sort ?? null,
      f.page ?? 0,
      f.size ?? 20,
    ] as const,
  stats: ['payments', 'stats'] as const,
}

export function usePayments(filters: PaymentFilters) {
  const { from, to, method, status, page = 0, size = 20, sort } = filters
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: async () =>
      unwrap(
        await api.GET('/api/v1/admin/payments', {
          params: {
            query: {
              from,
              to,
              method,
              status,
              pageable: { page, size, sort: sort ? [sort] : undefined },
            },
          },
        }),
      ),
  })
}

export function useSubscriptionStats() {
  return useQuery({
    queryKey: paymentKeys.stats,
    queryFn: async () => unwrap(await api.GET('/api/v1/admin/subscriptions/stats')),
  })
}

/** Télécharge l'export CSV et déclenche l'enregistrement du fichier. */
export async function exportPaymentsCsv(
  filters: Omit<PaymentFilters, 'page' | 'size' | 'sort'>,
): Promise<void> {
  const { data, error, response } = await api.GET('/api/v1/admin/payments/export', {
    params: { query: { format: 'csv', ...filters } },
    parseAs: 'blob',
  })
  if (error !== undefined || !response.ok) {
    throw toApiError(error, response.status)
  }
  const blob = data as unknown as Blob
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const filename = match?.[1] ?? 'payments.csv'

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
