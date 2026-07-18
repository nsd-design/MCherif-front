/*
 * Adaptateur mock : renvoie les données de démonstration avec un délai simulé
 * pour exercer les états de chargement (squelettes). Même signature async que
 * les futurs appels réseau, pour un remplacement direct par les appels API.
 */
import * as data from './data'
import type { Prayer, User } from '../../types'

const DELAY_MS = 350

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), DELAY_MS))
}

export const mockApi = {
  getDashboardStats: () => delay(data.dashboardStats),
  getRevenueSeries: () => delay(data.revenueSeries),
  getActivity: () => delay(data.activity),
  getEncodingJobs: () => delay(data.encodingJobs),

  getPrayers: () => delay(data.prayers),
  getPrayer: (id: string): Promise<Prayer | undefined> =>
    delay(data.prayers.find((p) => p.id === id)),

  getUsers: () => delay(data.users),
  getUser: (id: string): Promise<User | undefined> =>
    delay(data.users.find((u) => u.id === id)),

  getTransactions: () => delay(data.transactions),
  getPaymentSummary: () => delay(data.paymentSummary),

  getNotifications: () => delay(data.notifications),
  getAdmins: () => delay(data.admins),
  getPlans: () => delay(data.plans),

  getCurrentAdmin: () => delay(data.currentAdmin),
}
