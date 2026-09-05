/*
 * Hooks Tableau de bord (TanStack Query). Réponses en tableaux bruts pour
 * revenue/activity/encoding jobs, objet unique pour les stats.
 */
import { useQuery } from '@tanstack/react-query'
import { api, unwrap } from './http'
import type { EncodingState } from './types'

export const dashboardKeys = {
  /** Préfixe commun : `invalidateQueries({ queryKey: dashboardKeys.all })`
   *  relance tout le tableau de bord, y compris le sondage d'encodage. */
  all: ['dashboard'] as const,
  stats: ['dashboard', 'stats'] as const,
  revenue: (months: number) => ['dashboard', 'revenue', months] as const,
  activity: (limit: number) => ['dashboard', 'activity', limit] as const,
  encodingJobs: ['dashboard', 'encoding-jobs'] as const,
}

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: async () => unwrap(await api.GET('/api/v1/admin/dashboard/stats')),
  })
}

export function useRevenue(months = 12) {
  return useQuery({
    queryKey: dashboardKeys.revenue(months),
    queryFn: async () =>
      unwrap(await api.GET('/api/v1/admin/dashboard/revenue', { params: { query: { months } } })),
  })
}

export function useActivity(limit = 20) {
  return useQuery({
    queryKey: dashboardKeys.activity(limit),
    queryFn: async () =>
      unwrap(await api.GET('/api/v1/admin/dashboard/activity', { params: { query: { limit } } })),
  })
}

const TERMINAL_STATES: readonly EncodingState[] = ['READY', 'FAILED']

/**
 * Jobs d'encodage du tableau de bord.
 *
 * Le sondage s'arrête dès qu'il n'y a plus rien à surveiller (liste vide, ou
 * tous les jobs dans un état terminal) : un back-office laissé ouvert n'émet
 * alors aucune requête récurrente. Même modèle que `useEncodingStatus`
 * (`api/prayers.ts`).
 *
 * Il redémarre à l'invalidation de `dashboardKeys.all` — déclenchée après un
 * téléversement ou une publication, moments où un job apparaît.
 */
export function useEncodingJobs(state?: EncodingState) {
  return useQuery({
    queryKey: [...dashboardKeys.encodingJobs, state ?? null],
    queryFn: async () =>
      unwrap(
        await api.GET('/api/v1/admin/encoding/jobs', {
          params: { query: { state } },
        }),
      ),
    refetchInterval: (query) => {
      const jobs = query.state.data
      if (!jobs || jobs.length === 0) return false
      const allDone = jobs.every((j) => j.state != null && TERMINAL_STATES.includes(j.state))
      return allDone ? false : 5000
    },
  })
}
