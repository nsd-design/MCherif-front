/*
 * Hooks Prêches (TanStack Query). Aucune URL/type inventé : tout passe par le
 * client typé `api`. Invalidation du cache après chaque mutation.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from './http'
import { dashboardKeys } from './dashboard'
import type {
  CreatePrayerRequest,
  EncodingState,
  PrayerAccess,
  PrayerStatus,
  UpdatePrayerRequest,
} from './types'

export interface PrayerFilters {
  status?: PrayerStatus
  access?: PrayerAccess
  q?: string
  page?: number
  size?: number
  sort?: string
}

export const prayerKeys = {
  all: ['prayers'] as const,
  // Clé normalisée : primitives explicites et ordonnées, mêmes défauts que la
  // requête HTTP (cf. commentaire de tête de `api/http.ts`).
  list: (f: PrayerFilters) =>
    [
      'prayers',
      'list',
      f.status ?? null,
      f.access ?? null,
      f.q || null,
      f.sort ?? null,
      f.page ?? 0,
      f.size ?? 20,
    ] as const,
  detail: (id: string) => ['prayers', 'detail', id] as const,
  encoding: (id: string) => ['prayers', 'encoding', id] as const,
  stats: (id: string) => ['prayers', 'stats', id] as const,
}

/*
 * Le tableau de bord (stats + sondage des jobs d'encodage) dépend de l'état des
 * prêches : toute mutation qui crée un job ou change le nombre de publiés doit
 * l'invalider, sinon son sondage — qui s'arrête quand il n'y a plus rien à
 * surveiller — ne redémarrerait jamais.
 */
function invalidateDashboard(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: dashboardKeys.all })
}

// ─── Appels impératifs (assistant de publication : id dynamique) ─────────────
export async function createPrayer(body: CreatePrayerRequest) {
  return unwrap(await api.POST('/api/v1/admin/prayers', { body }))
}

export async function uploadAudioFile(id: string, file: File) {
  return unwrap(
    await api.POST('/api/v1/admin/prayers/{id}/audio', {
      params: { path: { id } },
      body: { file: file as unknown as string },
      bodySerializer() {
        const form = new FormData()
        form.append('file', file)
        return form
      },
    }),
  )
}

export async function setPrayerAccess(id: string, access: PrayerAccess) {
  return unwrap(
    await api.PATCH('/api/v1/admin/prayers/{id}/access', {
      params: { path: { id } },
      body: { access },
    }),
  )
}

export async function publishPrayerById(id: string, notify: boolean) {
  return unwrap(
    await api.POST('/api/v1/admin/prayers/{id}/publish', {
      params: { path: { id } },
      body: { notify },
    }),
  )
}

export function usePrayers(filters: PrayerFilters) {
  const { status, access, q, page = 0, size = 20, sort } = filters
  return useQuery({
    queryKey: prayerKeys.list(filters),
    queryFn: async () =>
      unwrap(
        await api.GET('/api/v1/admin/prayers', {
          params: {
            query: {
              status,
              access,
              q: q || undefined,
              pageable: { page, size, sort: sort ? [sort] : undefined },
            },
          },
        }),
      ),
  })
}

export function usePrayer(id: string) {
  return useQuery({
    queryKey: prayerKeys.detail(id),
    queryFn: async () =>
      unwrap(await api.GET('/api/v1/admin/prayers/{id}', { params: { path: { id } } })),
    enabled: Boolean(id),
  })
}

export function usePrayerStats(id: string) {
  return useQuery({
    queryKey: prayerKeys.stats(id),
    queryFn: async () =>
      unwrap(
        await api.GET('/api/v1/admin/prayers/{id}/stats', { params: { path: { id } } }),
      ),
    enabled: Boolean(id),
  })
}

/** Suivi d'encodage : poll tant que l'état n'est pas terminal (READY/FAILED). */
export function useEncodingStatus(id: string, enabled: boolean) {
  return useQuery({
    queryKey: prayerKeys.encoding(id),
    queryFn: async () =>
      unwrap(
        await api.GET('/api/v1/admin/prayers/{id}/encoding', { params: { path: { id } } }),
      ),
    enabled: enabled && Boolean(id),
    refetchInterval: (query) => {
      const state = query.state.data?.state as EncodingState | undefined
      return state === 'READY' || state === 'FAILED' ? false : 1500
    },
  })
}

export function useCreatePrayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreatePrayerRequest) =>
      unwrap(await api.POST('/api/v1/admin/prayers', { body })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: prayerKeys.all })
      invalidateDashboard(qc)
    },
  })
}

export function useUpdatePrayer(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: UpdatePrayerRequest) =>
      unwrap(
        await api.PATCH('/api/v1/admin/prayers/{id}', { params: { path: { id } }, body }),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: prayerKeys.detail(id) })
      qc.invalidateQueries({ queryKey: prayerKeys.all })
    },
  })
}

export function useSetAccess(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (access: PrayerAccess) =>
      unwrap(
        await api.PATCH('/api/v1/admin/prayers/{id}/access', {
          params: { path: { id } },
          body: { access },
        }),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: prayerKeys.detail(id) })
      qc.invalidateQueries({ queryKey: prayerKeys.all })
    },
  })
}

export function useUploadAudio(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) =>
      unwrap(
        await api.POST('/api/v1/admin/prayers/{id}/audio', {
          params: { path: { id } },
          body: { file: file as unknown as string },
          // Multipart : construire le FormData ; ne pas fixer Content-Type.
          bodySerializer() {
            const form = new FormData()
            form.append('file', file)
            return form
          },
        }),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: prayerKeys.encoding(id) })
      invalidateDashboard(qc)
    },
  })
}

export function usePublishPrayer(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (notify: boolean) =>
      unwrap(
        await api.POST('/api/v1/admin/prayers/{id}/publish', {
          params: { path: { id } },
          body: { notify },
        }),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: prayerKeys.detail(id) })
      qc.invalidateQueries({ queryKey: prayerKeys.all })
      invalidateDashboard(qc)
    },
  })
}

export function useUnpublishPrayer(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST('/api/v1/admin/prayers/{id}/unpublish', { params: { path: { id } } }),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: prayerKeys.detail(id) })
      qc.invalidateQueries({ queryKey: prayerKeys.all })
      invalidateDashboard(qc)
    },
  })
}

export function useNotifyPrayer(id: string) {
  return useMutation({
    mutationFn: async () =>
      unwrap(
        await api.POST('/api/v1/admin/prayers/{id}/notify', { params: { path: { id } } }),
      ),
  })
}

export function useDeletePrayer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(
        await api.DELETE('/api/v1/admin/prayers/{id}', { params: { path: { id } } }),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: prayerKeys.all })
      invalidateDashboard(qc)
    },
  })
}
