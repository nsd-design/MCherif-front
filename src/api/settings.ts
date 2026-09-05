/*
 * Hooks Paramètres (TanStack Query) : plans, protection DRM, administrateurs.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from './http'
import type { AdminRole, PlanUpdate } from './types'

export const settingsKeys = {
  plans: ['settings', 'plans'] as const,
  protection: ['settings', 'protection'] as const,
  admins: ['settings', 'admins'] as const,
}

export function usePlans() {
  return useQuery({
    queryKey: settingsKeys.plans,
    queryFn: async () => unwrap(await api.GET('/api/v1/admin/settings/plans')),
  })
}

export function useUpdatePlans() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (plans: PlanUpdate[]) =>
      unwrap(await api.PUT('/api/v1/admin/settings/plans', { body: { plans } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.plans }),
  })
}

export function useProtection() {
  return useQuery({
    queryKey: settingsKeys.protection,
    queryFn: async () => unwrap(await api.GET('/api/v1/admin/settings/protection')),
  })
}

export function useUpdateProtection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { maxDevicesPerAccount?: number; premiumValidityDays?: number }) =>
      unwrap(await api.PATCH('/api/v1/admin/settings/protection', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.protection }),
  })
}

export function useAdmins() {
  return useQuery({
    queryKey: settingsKeys.admins,
    queryFn: async () => unwrap(await api.GET('/api/v1/admin/settings/admins')),
  })
}

export function useInviteAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { email: string; role: AdminRole }) =>
      unwrap(await api.POST('/api/v1/admin/settings/admins', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.admins }),
  })
}

export function useUpdateAdminRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: AdminRole }) =>
      unwrap(
        await api.PATCH('/api/v1/admin/settings/admins/{id}', {
          params: { path: { id } },
          body: { role },
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.admins }),
  })
}

export function useDeleteAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(
        await api.DELETE('/api/v1/admin/settings/admins/{id}', { params: { path: { id } } }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.admins }),
  })
}
