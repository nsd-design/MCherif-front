/*
 * Hooks Notifications (TanStack Query).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from './http'
import type { SendNotificationRequest } from './types'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (page: number, size: number) => ['notifications', 'list', page, size] as const,
}

export function useNotifications(page = 0, size = 20) {
  return useQuery({
    queryKey: notificationKeys.list(page, size),
    queryFn: async () =>
      unwrap(
        await api.GET('/api/v1/admin/notifications', {
          params: { query: { pageable: { page, size, sort: ['sentAt,desc'] } } },
        }),
      ),
  })
}

export function useSendNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: SendNotificationRequest) =>
      unwrap(await api.POST('/api/v1/admin/notifications', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}
