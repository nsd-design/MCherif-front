/*
 * Hooks de données via TanStack Query. Les pages consomment ces hooks — jamais
 * de fetch direct. Actuellement adossés à la couche mock.
 * TODO(api): remplacer mockApi.* par les appels openapi-fetch correspondants.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mockApi } from './mock'
import type { NotificationItem, NotificationTarget } from '../types'

export const queryKeys = {
  dashboardStats: ['dashboard', 'stats'] as const,
  revenue: ['dashboard', 'revenue'] as const,
  activity: ['dashboard', 'activity'] as const,
  encodingJobs: ['encoding', 'jobs'] as const,
  prayers: ['prayers'] as const,
  prayer: (id: string) => ['prayers', id] as const,
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  transactions: ['transactions'] as const,
  paymentSummary: ['payments', 'summary'] as const,
  notifications: ['notifications'] as const,
  admins: ['admins'] as const,
  plans: ['plans'] as const,
}

export const useDashboardStats = () =>
  useQuery({ queryKey: queryKeys.dashboardStats, queryFn: mockApi.getDashboardStats })

export const useRevenueSeries = () =>
  useQuery({ queryKey: queryKeys.revenue, queryFn: mockApi.getRevenueSeries })

export const useActivity = () =>
  useQuery({ queryKey: queryKeys.activity, queryFn: mockApi.getActivity })

export const useEncodingJobs = () =>
  useQuery({ queryKey: queryKeys.encodingJobs, queryFn: mockApi.getEncodingJobs })

export const usePrayers = () =>
  useQuery({ queryKey: queryKeys.prayers, queryFn: mockApi.getPrayers })

export const usePrayer = (id: string) =>
  useQuery({ queryKey: queryKeys.prayer(id), queryFn: () => mockApi.getPrayer(id) })

export const useUsers = () =>
  useQuery({ queryKey: queryKeys.users, queryFn: mockApi.getUsers })

export const useTransactions = () =>
  useQuery({ queryKey: queryKeys.transactions, queryFn: mockApi.getTransactions })

export const usePaymentSummary = () =>
  useQuery({ queryKey: queryKeys.paymentSummary, queryFn: mockApi.getPaymentSummary })

export const useNotifications = () =>
  useQuery({ queryKey: queryKeys.notifications, queryFn: mockApi.getNotifications })

export const useAdmins = () =>
  useQuery({ queryKey: queryKeys.admins, queryFn: mockApi.getAdmins })

export const usePlans = () =>
  useQuery({ queryKey: queryKeys.plans, queryFn: mockApi.getPlans })

export interface SendNotificationInput {
  title: string
  message: string
  target: NotificationTarget
}

/**
 * Envoi d'une notification. Optimiste côté mock : ajoute l'entrée en tête de
 * l'historique. TODO(api): POST /notifications.
 */
export function useSendNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SendNotificationInput) => {
      await new Promise((r) => setTimeout(r, 400))
      const item: NotificationItem = {
        id: `n-${Date.now()}`,
        title: input.title,
        message: input.message,
        target: input.target,
        sentAt: new Date().toISOString(),
        sentCount: input.target === 'all' ? 4812 : 3265,
      }
      return item
    },
    onSuccess: (item) => {
      qc.setQueryData<NotificationItem[]>(queryKeys.notifications, (prev) =>
        prev ? [item, ...prev] : [item],
      )
    },
  })
}
