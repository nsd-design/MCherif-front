/*
 * Données de démonstration reprises fidèlement des maquettes
 * (`Back-office Admin.dc.html`). Servent la couche mock en attendant le backend.
 * TODO(api): supprimer une fois les vrais endpoints branchés.
 */
import type {
  Admin,
  ActivityItem,
  DashboardStats,
  EncodingJob,
  NotificationItem,
  PaymentSummary,
  Plan,
  Prayer,
  RevenuePoint,
  Transaction,
  User,
} from '../../types'

export const dashboardStats: DashboardStats = {
  activeUsers: { value: '4 812', change: '+312 ce mois' },
  activeSubscriptions: { value: '3 265', change: '+6,1 % ce mois' },
  monthlyRevenueGnf: { value: 38_450_000, change: '+9,8 % vs juin' },
  publishedPrayers: { value: '128', change: '+4 ce mois' },
}

export const revenueSeries: RevenuePoint[] = [
  { monthLabel: 'Août', revenueGnf: 14_400_000 },
  { monthLabel: 'Sept.', revenueGnf: 12_600_000 },
  { monthLabel: 'Oct.', revenueGnf: 18_000_000 },
  { monthLabel: 'Nov.', revenueGnf: 20_400_000 },
  { monthLabel: 'Déc.', revenueGnf: 18_600_000 },
  { monthLabel: 'Janv.', revenueGnf: 24_600_000 },
  { monthLabel: 'Févr.', revenueGnf: 26_400_000 },
  { monthLabel: 'Mars', revenueGnf: 24_000_000 },
  { monthLabel: 'Avr.', revenueGnf: 30_600_000 },
  { monthLabel: 'Mai', revenueGnf: 34_200_000 },
  { monthLabel: 'Juin', revenueGnf: 32_400_000 },
  { monthLabel: 'Juil.', revenueGnf: 38_400_000 },
]

export const activity: ActivityItem[] = [
  {
    id: 'a1',
    text: 'Paiement reçu — Annuel · Orange Money · +224 620 12 34 56',
    timeLabel: 'il y a 6 min',
    kind: 'success',
  },
  {
    id: 'a2',
    text: '« Prêche de l’Aïd el-Fitr » republié après mise à jour de la description',
    timeLabel: 'il y a 40 min',
    kind: 'success',
  },
  {
    id: 'a3',
    text: 'Nouveau compte — +224 655 08 41 27',
    timeLabel: 'il y a 1 h',
    kind: 'neutral',
  },
  {
    id: 'a4',
    text: 'Échec de paiement — Mensuel · MTN MoMo · +224 628 77 02 13',
    timeLabel: 'il y a 2 h',
    kind: 'danger',
  },
]

export const encodingJobs: EncodingJob[] = [
  {
    id: 'e1',
    title: 'La zakat et le partage',
    progress: 64,
    currentStep: 'encryption',
    stepLabel: 'Chiffrement DRM…',
  },
  {
    id: 'e2',
    title: 'Prêche du 10 juillet',
    progress: 18,
    currentStep: 'transcoding',
    stepLabel: 'Transcodage audio…',
  },
]

const COVER = '/cheick.jpeg'

export const prayers: Prayer[] = [
  {
    id: 'la-patience-et-la-foi',
    title: 'La patience et la foi',
    theme: 'Foi',
    recordedAt: '2026-06-12',
    durationSec: 3480,
    status: 'published',
    access: 'free',
    plays: 12_480,
    language: 'Français',
    description:
      'Prêche du vendredi sur la patience face aux épreuves et la constance dans la foi.',
    coverUrl: COVER,
  },
  {
    id: 'les-bienfaits-du-ramadan',
    title: 'Les bienfaits du Ramadan',
    theme: 'Ramadan',
    recordedAt: '2026-05-28',
    durationSec: 4320,
    status: 'published',
    access: 'premium',
    plays: 9_302,
    language: 'Français',
    description: 'Les mérites du mois de Ramadan et le sens du jeûne.',
    coverUrl: COVER,
  },
  {
    id: 'le-respect-des-parents',
    title: 'Le respect des parents',
    theme: 'Famille',
    recordedAt: '2026-05-15',
    durationSec: 2820,
    status: 'published',
    access: 'premium',
    plays: 8_114,
    language: 'Français',
    description: 'Le devoir de bienveillance envers les parents.',
    coverUrl: COVER,
  },
  {
    id: 'la-zakat-et-le-partage',
    title: 'La zakat et le partage',
    theme: 'Zakat',
    recordedAt: '2026-04-30',
    durationSec: 3120,
    status: 'encoding',
    access: 'premium',
    plays: null,
    language: 'Français',
    description: "L'aumône légale et la solidarité entre les croyants.",
    coverUrl: COVER,
  },
  {
    id: 'education-des-enfants',
    title: "L'éducation des enfants",
    theme: 'Famille',
    recordedAt: '2026-04-17',
    durationSec: 3900,
    status: 'draft',
    access: 'premium',
    plays: null,
    language: 'Français',
    description: "Les principes de l'éducation dans l'islam.",
    coverUrl: COVER,
  },
  {
    id: 'preche-aid-el-fitr',
    title: "Prêche de l'Aïd el-Fitr",
    theme: 'Aïd',
    recordedAt: '2026-04-02',
    durationSec: 2280,
    status: 'published',
    access: 'free',
    plays: 15_037,
    language: 'Français',
    description: "Sermon de la fête de la rupture du jeûne, en accès gratuit.",
    coverUrl: COVER,
  },
  {
    id: 'la-sincerite-dans-ladoration',
    title: "La sincérité dans l'adoration",
    theme: 'Foi',
    recordedAt: '2026-03-20',
    durationSec: 3300,
    status: 'failed',
    access: 'premium',
    plays: null,
    language: 'Français',
    description: "L'intention pure dans les actes d'adoration.",
    coverUrl: COVER,
  },
]

export const users: User[] = [
  {
    id: 'u1',
    fullName: 'Aïssata Diallo',
    initials: 'AD',
    phone: '+224 620 12 34 56',
    registeredAt: '2026-01-03',
    subscriptionStatus: 'active',
    subscriptionEndsAt: '2027-03-12',
    planLabel: 'Annuel — 100 000 GNF',
    amountGnf: 100_000,
    devicesUsed: 2,
    devicesMax: 3,
    devices: [
      { id: 'd1', name: 'Samsung Galaxy A15', lastListenedLabel: "aujourd'hui" },
      { id: 'd2', name: 'iPhone 12', lastListenedLabel: '2 juil. 2026' },
    ],
    payments: [
      { id: 'p1', dateLabel: '12 mars 2026', plan: 'Annuel', method: 'Orange Money', amountGnf: 100_000 },
      { id: 'p2', dateLabel: '12 févr. 2026', plan: 'Mensuel', method: 'Orange Money', amountGnf: 10_000 },
      { id: 'p3', dateLabel: '12 janv. 2026', plan: 'Mensuel', method: 'MTN MoMo', amountGnf: 10_000 },
    ],
  },
  {
    id: 'u2',
    fullName: 'Mamadou Barry',
    initials: 'MB',
    phone: '+224 655 08 41 27',
    registeredAt: '2026-07-14',
    subscriptionStatus: 'none',
    subscriptionEndsAt: null,
    planLabel: null,
    amountGnf: null,
    devicesUsed: 1,
    devicesMax: 3,
    devices: [{ id: 'd4', name: 'Tecno Spark 10', lastListenedLabel: "aujourd'hui" }],
    payments: [],
  },
  {
    id: 'u3',
    fullName: 'Fatoumata Camara',
    initials: 'FC',
    phone: '+224 622 90 55 18',
    registeredAt: '2026-02-22',
    subscriptionStatus: 'active',
    subscriptionEndsAt: '2027-02-22',
    planLabel: 'Annuel — 100 000 GNF',
    amountGnf: 100_000,
    devicesUsed: 1,
    devicesMax: 3,
    devices: [{ id: 'd5', name: 'iPhone 13', lastListenedLabel: 'hier' }],
    payments: [
      { id: 'p4', dateLabel: '22 févr. 2026', plan: 'Annuel', method: 'Orange Money', amountGnf: 100_000 },
    ],
  },
  {
    id: 'u4',
    fullName: 'Ibrahima Sow',
    initials: 'IS',
    phone: '+224 628 77 02 13',
    registeredAt: '2025-11-09',
    subscriptionStatus: 'expired',
    subscriptionEndsAt: '2026-05-09',
    planLabel: 'Mensuel — 10 000 GNF',
    amountGnf: 10_000,
    devicesUsed: 2,
    devicesMax: 3,
    devices: [
      { id: 'd6', name: 'Xiaomi Redmi 12', lastListenedLabel: '9 mai 2026' },
      { id: 'd7', name: 'Samsung Galaxy A05', lastListenedLabel: '3 mai 2026' },
    ],
    payments: [
      { id: 'p5', dateLabel: '9 avr. 2026', plan: 'Mensuel', method: 'MTN MoMo', amountGnf: 10_000 },
    ],
  },
  {
    id: 'u5',
    fullName: 'Kadiatou Keïta',
    initials: 'KK',
    phone: '+224 610 33 76 90',
    registeredAt: '2026-06-01',
    subscriptionStatus: 'active',
    subscriptionEndsAt: '2027-07-01',
    planLabel: 'Annuel — 100 000 GNF',
    amountGnf: 100_000,
    devicesUsed: 3,
    devicesMax: 3,
    devices: [
      { id: 'd8', name: 'iPhone 14', lastListenedLabel: "aujourd'hui" },
      { id: 'd9', name: 'iPad Air', lastListenedLabel: 'hier' },
      { id: 'd10', name: 'Samsung Galaxy S21', lastListenedLabel: '5 juil. 2026' },
    ],
    payments: [
      { id: 'p6', dateLabel: '1 juil. 2026', plan: 'Annuel', method: 'Carte bancaire', amountGnf: 100_000 },
    ],
  },
  {
    id: 'u6',
    fullName: 'Ousmane Baldé',
    initials: 'OB',
    phone: '+224 666 45 12 08',
    registeredAt: '2026-03-18',
    subscriptionStatus: 'active',
    subscriptionEndsAt: '2027-04-18',
    planLabel: 'Mensuel — 10 000 GNF',
    amountGnf: 10_000,
    devicesUsed: 1,
    devicesMax: 3,
    devices: [{ id: 'd11', name: 'Infinix Note 30', lastListenedLabel: "aujourd'hui" }],
    payments: [
      { id: 'p7', dateLabel: '18 juin 2026', plan: 'Mensuel', method: 'Orange Money', amountGnf: 10_000 },
    ],
  },
  {
    id: 'u7',
    fullName: 'Hadja Sylla',
    initials: 'HS',
    phone: '+224 621 84 30 66',
    registeredAt: '2025-12-27',
    subscriptionStatus: 'expired',
    subscriptionEndsAt: '2026-06-27',
    planLabel: 'Annuel — 100 000 GNF',
    amountGnf: 100_000,
    devicesUsed: 1,
    devicesMax: 3,
    devices: [{ id: 'd12', name: 'iPhone 11', lastListenedLabel: '27 juin 2026' }],
    payments: [
      { id: 'p8', dateLabel: '27 déc. 2025', plan: 'Annuel', method: 'Carte bancaire', amountGnf: 100_000 },
    ],
  },
]

export const transactions: Transaction[] = [
  { id: 't1', date: '2026-07-12', phone: '+224 620 12 34 56', plan: 'yearly', method: 'orange', amountGnf: 100_000, status: 'success', reference: 'TX-98F2C1' },
  { id: 't2', date: '2026-07-12', phone: '+224 655 08 41 27', plan: 'monthly', method: 'mtn', amountGnf: 10_000, status: 'pending', reference: 'TX-98F1B7' },
  { id: 't3', date: '2026-07-11', phone: '+224 622 90 55 18', plan: 'monthly', method: 'orange', amountGnf: 10_000, status: 'success', reference: 'TX-98E9A4' },
  { id: 't4', date: '2026-07-11', phone: '+224 628 77 02 13', plan: 'monthly', method: 'mtn', amountGnf: 10_000, status: 'failed', reference: 'TX-98E877' },
  { id: 't5', date: '2026-07-10', phone: '+224 610 33 76 90', plan: 'yearly', method: 'card', amountGnf: 100_000, status: 'success', reference: 'TX-98E102' },
  { id: 't6', date: '2026-07-10', phone: '+224 666 45 12 08', plan: 'monthly', method: 'orange', amountGnf: 10_000, status: 'success', reference: 'TX-98D6F8' },
  { id: 't7', date: '2026-07-09', phone: '+224 621 84 30 66', plan: 'yearly', method: 'card', amountGnf: 100_000, status: 'success', reference: 'TX-98D021' },
]

export const paymentSummary: PaymentSummary = {
  monthlyRevenueGnf: 38_450_000,
  monthlyRevenueChange: '+9,8 % vs juin',
  activeSubscriptions: '3 265',
  activeSubscriptionsChange: '+188 ce mois',
  renewalRate: '82 %',
  renewalRateChange: 'stable',
}

export const notifications: NotificationItem[] = [
  { id: 'n1', title: 'Nouveau prêche disponible', message: '« La patience et la foi » — le prêche du vendredi est en ligne. Bonne écoute.', sentAt: '2026-06-12', target: 'all', sentCount: 4812 },
  { id: 'n2', title: 'Nouveau prêche disponible', message: '« Les bienfaits du Ramadan » est disponible dans l’application.', sentAt: '2026-05-28', target: 'all', sentCount: 4655 },
  { id: 'n3', title: 'Votre abonnement expire bientôt', message: 'Renouvelez avant le 30 mai pour garder l’accès à tous les prêches.', sentAt: '2026-05-20', target: 'subscribers', sentCount: 612 },
  { id: 'n4', title: 'Nouveau prêche disponible', message: '« Le respect des parents » est disponible dans l’application.', sentAt: '2026-05-15', target: 'all', sentCount: 4590 },
  { id: 'n5', title: 'Nouveau prêche disponible', message: '« La zakat et le partage » est disponible dans l’application.', sentAt: '2026-04-30', target: 'all', sentCount: 4471 },
  { id: 'n6', title: 'Aïd Moubarak', message: "Retrouvez le prêche de l'Aïd el-Fitr, en accès gratuit pour tous.", sentAt: '2026-04-02', target: 'all', sentCount: 4388 },
]

export const admins: Admin[] = [
  { id: 'ad1', fullName: 'Abdoulaye Diallo', initials: 'AD', email: 'a.diallo@mohamedcherif.app', role: 'super' },
  { id: 'ad2', fullName: 'Mariama Soumah', initials: 'MS', email: 'm.soumah@mohamedcherif.app', role: 'editor' },
  { id: 'ad3', fullName: 'Thierno Condé', initials: 'TC', email: 't.conde@mohamedcherif.app', role: 'finance' },
]

export const plans: Plan[] = [
  { kind: 'monthly', name: 'Mensuel', subtitle: 'Sans engagement', priceGnf: 10_000, periodLabel: '/ mois' },
  { kind: 'yearly', name: 'Annuel', subtitle: 'Validité 1 an', priceGnf: 100_000, periodLabel: '/ an', badge: '2 mois offerts' },
]

export const currentAdmin: Admin = admins[0]
