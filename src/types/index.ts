/*
 * Types provisoires du domaine admin.
 * TODO(api): remplacer par les types générés depuis l'OpenAPI du backend
 * Spring Boot (`pnpm gen:api` -> src/api/generated/schema.d.ts) dès que la
 * spec `/v3/api-docs` est disponible.
 */

export type PrayerStatus = 'published' | 'encoding' | 'draft' | 'failed'
export type AccessTier = 'free' | 'premium'

export interface Prayer {
  id: string
  title: string
  theme: string
  /** Date d'enregistrement, ISO 8601. */
  recordedAt: string
  /** Durée en secondes. */
  durationSec: number
  status: PrayerStatus
  access: AccessTier
  /** Nombre d'écoutes ; null si non publié. */
  plays: number | null
  language: string
  description: string
  coverUrl: string
}

export type SubscriptionStatus = 'active' | 'expired' | 'none'

export interface UserDevice {
  id: string
  name: string
  lastListenedLabel: string
}

export interface UserPayment {
  id: string
  dateLabel: string
  plan: string
  method: string
  amountGnf: number
}

export interface User {
  id: string
  fullName: string
  initials: string
  phone: string
  /** Date d'inscription, ISO 8601. */
  registeredAt: string
  subscriptionStatus: SubscriptionStatus
  /** Échéance d'abonnement, ISO 8601 ou null. */
  subscriptionEndsAt: string | null
  planLabel: string | null
  amountGnf: number | null
  devicesUsed: number
  devicesMax: number
  devices: UserDevice[]
  payments: UserPayment[]
}

export type PaymentMethod = 'orange' | 'mtn' | 'card'
export type TransactionStatus = 'success' | 'pending' | 'failed'
export type PlanKind = 'monthly' | 'yearly'

export interface Transaction {
  id: string
  /** Date de la transaction, ISO 8601. */
  date: string
  phone: string
  plan: PlanKind
  method: PaymentMethod
  amountGnf: number
  status: TransactionStatus
  reference: string
}

export type NotificationTarget = 'all' | 'subscribers'

export interface NotificationItem {
  id: string
  title: string
  message: string
  /** Date d'envoi, ISO 8601. */
  sentAt: string
  target: NotificationTarget
  sentCount: number
}

export type AdminRole = 'super' | 'editor' | 'finance'

export interface Admin {
  id: string
  fullName: string
  initials: string
  email: string
  role: AdminRole
}

export interface DashboardStats {
  activeUsers: { value: string; change: string }
  activeSubscriptions: { value: string; change: string }
  monthlyRevenueGnf: { value: number; change: string }
  publishedPrayers: { value: string; change: string }
}

export interface RevenuePoint {
  monthLabel: string
  revenueGnf: number
}

export type ActivityKind = 'success' | 'neutral' | 'danger'

export interface ActivityItem {
  id: string
  text: string
  timeLabel: string
  kind: ActivityKind
}

export type EncodingStep = 'uploaded' | 'transcoding' | 'encryption' | 'ready'

export interface EncodingJob {
  id: string
  title: string
  progress: number
  currentStep: EncodingStep
  stepLabel: string
}

export interface PaymentSummary {
  monthlyRevenueGnf: number
  monthlyRevenueChange: string
  activeSubscriptions: string
  activeSubscriptionsChange: string
  renewalRate: string
  renewalRateChange: string
}

export interface Plan {
  kind: PlanKind
  name: string
  subtitle: string
  priceGnf: number
  periodLabel: string
  badge?: string
}
