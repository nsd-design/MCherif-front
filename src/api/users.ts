/*
 * Hooks Utilisateurs (TanStack Query).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from './http'

export interface UserFilters {
  subscription?: 'active' | 'expired' | 'no-subscription'
  q?: string
  page?: number
  size?: number
  /** Tri Spring `'champ,desc'`. Champs de l'entité User uniquement :
   *  `displayName`, `phone`, `createdAt`, `status`. Les colonnes dérivées
   *  (abonnement, expiration, nombre d'appareils) viennent d'autres tables et
   *  ne sont pas triables. */
  sort?: string
}

export const userKeys = {
  all: ['users'] as const,
  // Clé normalisée : primitives explicites et ordonnées, mêmes défauts que la
  // requête HTTP (cf. commentaire de tête de `api/http.ts`).
  list: (f: UserFilters) =>
    [
      'users',
      'list',
      f.subscription ?? null,
      f.q || null,
      f.sort ?? null,
      f.page ?? 0,
      f.size ?? 20,
    ] as const,
  detail: (id: string) => ['users', 'detail', id] as const,
}

export function useUsers(filters: UserFilters) {
  const { subscription, q, page = 0, size = 20, sort } = filters
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: async () =>
      unwrap(
        await api.GET('/api/v1/admin/users', {
          params: {
            query: {
              subscription,
              q: q || undefined,
              pageable: { page, size, sort: sort ? [sort] : undefined },
            },
          },
        }),
      ),
  })
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ''),
    queryFn: async () =>
      unwrap(await api.GET('/api/v1/admin/users/{id}', { params: { path: { id: id! } } })),
    enabled: Boolean(id),
  })
}

function invalidateUser(qc: ReturnType<typeof useQueryClient>, id: string) {
  qc.invalidateQueries({ queryKey: userKeys.detail(id) })
  qc.invalidateQueries({ queryKey: userKeys.all })
}

export function useRevokeDevice(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (deviceId: string) =>
      unwrap(
        await api.DELETE('/api/v1/admin/users/{id}/devices/{deviceId}', {
          params: { path: { id: userId, deviceId } },
        }),
      ),
    onSuccess: () => invalidateUser(qc, userId),
  })
}

export function useExtendSubscription(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { days?: number; until?: string }) =>
      unwrap(
        await api.POST('/api/v1/admin/users/{id}/subscription/extend', {
          params: { path: { id: userId } },
          body,
        }),
      ),
    onSuccess: () => invalidateUser(qc, userId),
  })
}

export function useBlockUser(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST('/api/v1/admin/users/{id}/block', { params: { path: { id: userId } } }),
      ),
    onSuccess: () => invalidateUser(qc, userId),
  })
}

export function useUnblockUser(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST('/api/v1/admin/users/{id}/unblock', { params: { path: { id: userId } } }),
      ),
    onSuccess: () => invalidateUser(qc, userId),
  })
}
