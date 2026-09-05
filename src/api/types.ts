/*
 * Types du domaine = alias des schémas générés depuis l'OpenAPI
 * (src/api/generated/schema.d.ts, via `pnpm gen:api`). On ne réécrit jamais un
 * type d'API à la main. Tous les champs sont optionnels côté schéma (le backend
 * ne les annote pas `required`) — les composants gèrent donc les valeurs nulles.
 */
import type { components } from './generated/schema'

type S = components['schemas']

// ─── Enums ─────────────────────────────────────────────────────────────────
export type PrayerStatus = NonNullable<S['PrayerListItem']['status']>
export type PrayerAccess = NonNullable<S['PrayerListItem']['access']>
export type EncodingState = NonNullable<S['EncodingStatusResponse']['state']>
export type NotificationTarget = NonNullable<S['NotificationHistoryItem']['target']>
export type PaymentMethod = NonNullable<S['PaymentListItem']['method']>
export type PaymentStatus = NonNullable<S['PaymentListItem']['status']>
export type SubscriptionStatus = NonNullable<S['SubscriptionInfo']['status']>
export type UserStatus = NonNullable<S['UserDetailResponse']['status']>
export type AdminRole = NonNullable<S['AdminSummary']['role']>

// ─── Auth ──────────────────────────────────────────────────────────────────
export type TokenResponse = S['TokenResponse']

// ─── Prêches ───────────────────────────────────────────────────────────────
export type PrayerListItem = S['PrayerListItem']
export type PrayerDetailResponse = S['PrayerDetailResponse']
export type CreatePrayerRequest = S['CreatePrayerRequest']
export type UpdatePrayerRequest = S['UpdatePrayerRequest']
export type UploadResponse = S['UploadResponse']
export type EncodingStatusResponse = S['EncodingStatusResponse']
export type PrayerStatsResponse = S['PrayerStatsResponse']
export type ProtectionInfo = S['ProtectionInfo']

// ─── Utilisateurs ──────────────────────────────────────────────────────────
export type UserListItem = S['UserListItem']
export type UserDetailResponse = S['UserDetailResponse']
export type SubscriptionInfo = S['SubscriptionInfo']
export type DeviceInfo = S['DeviceInfo']
export type PaymentHistoryItem = S['PaymentHistoryItem']

// ─── Paiements / abonnements ───────────────────────────────────────────────
export type PaymentListItem = S['PaymentListItem']
export type MetricValue = S['MetricValue']
export type SubscriptionStatsResponse = S['SubscriptionStatsResponse']

// ─── Notifications ─────────────────────────────────────────────────────────
export type NotificationHistoryItem = S['NotificationHistoryItem']
export type SendNotificationRequest = S['SendNotificationRequest']

// ─── Dashboard ─────────────────────────────────────────────────────────────
export type DashboardStatsResponse = S['DashboardStatsResponse']
export type RevenuePoint = S['RevenuePoint']
export type ActivityItem = S['ActivityItem']
export type EncodingJobItem = S['EncodingJobItem']

// ─── Paramètres ────────────────────────────────────────────────────────────
export type PlanResponse = S['PlanResponse']
export type PlanUpdate = S['PlanUpdate']
export type ProtectionResponse = S['ProtectionResponse']
export type AdminSummary = S['AdminSummary']

// ─── Enveloppe de pagination générique ─────────────────────────────────────
/*
 * Dérivée d'une enveloppe GÉNÉRÉE plutôt que réécrite : les métadonnées y sont
 * optionnelles, comme partout dans le schéma. La version manuelle précédente
 * les déclarait obligatoires — un piège dormant (elle n'était importée nulle
 * part) qui aurait fait croire à `data.content` non nul.
 */
type PageEnvelope = S['PageResponseUserListItem']
export type PageResponse<T> = Omit<PageEnvelope, 'content'> & { content?: T[] }

// ─── Erreur RFC 7807 ───────────────────────────────────────────────────────
export interface ProblemDetail {
  type?: string
  title?: string
  status: number
  detail?: string // technique/FR — ne jamais afficher tel quel
  code: string // clé stable pour l'i18n
  timestamp?: string
  errors?: string[] // présent quand code === 'validation'
}
