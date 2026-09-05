# API Back-Office Mohamed Chérif — Référence Frontend

> Contrat d'intégration destiné à l'agent/développeur **frontend du back-office admin** (web).
> Décrit exactement ce que le back-end expose aujourd'hui. Généré à partir du code source (contrôleurs, DTO, `SecurityConfig`, `GlobalExceptionHandler`).
>
> **Périmètre** : ce document couvre la surface **admin** (`/api/v1/admin/**`). La surface mobile est exposée elle aussi et fait l'objet d'un contrat distinct — voir `API-MOBILE.md`.

---

## 1. Aperçu

| | |
|---|---|
| **Base URL (dev)** | `http://localhost:8080` |
| **Préfixe** | tous les chemins commencent par `/api/v1` (aucun `context-path` supplémentaire) |
| **Contenu** | requêtes/réponses `application/json` ; erreurs `application/problem+json` |
| **Auth** | JWT Bearer — `Authorization: Bearer <accessToken>` sur tout `/api/v1/admin/**` (sauf endpoints publics ci-dessous) |
| **Rôle** | toute la surface exige `ROLE_ADMIN` |
| **Swagger UI** | `http://localhost:8080/swagger-ui.html` |
| **OpenAPI JSON** | `http://localhost:8080/v3/api-docs` |

**Endpoints publics (sans token)** : `POST /admin/auth/login`, `/verify`, `/refresh`, `/password/forgot`, `/password/reset` ; `/swagger-ui/**`, `/v3/api-docs/**` ; `/actuator/health`, `/actuator/info` ; toutes les requêtes `OPTIONS` (préflight CORS). Tout le reste exige le Bearer.

### CORS
- Origine autorisée : **une seule**, `app.cors.admin-origin` (défaut **`http://localhost:5173`**, surchargée par la variable d'env `ADMIN_WEB_ORIGIN`).
- Méthodes : `GET, POST, PUT, PATCH, DELETE, OPTIONS`.
- Headers requête autorisés : `Authorization, Content-Type`.
- Headers réponse exposés : `Content-Disposition` (utile pour l'export CSV).
- `allowCredentials = true`, `maxAge = 3600`.

> Le front doit être servi depuis l'origine configurée, sinon le navigateur bloque les appels. En dev, servir le back-office sur `http://localhost:5173` (Vite) ou ajuster `ADMIN_WEB_ORIGIN`.

> ⚠️ **`credentials: 'include'` est obligatoire sur tous les appels d'auth** (`verify`, `refresh`, `logout`) : le refresh voyage dans un cookie `HttpOnly`, et sans cette option le navigateur ne l'envoie pas. Le plus simple reste de servir le front en **même origine** que l'API (proxy Vite en dev) : le cookie est alors en `SameSite=Strict`, ce qui écarte le CSRF sans travail supplémentaire. Un déploiement du front sur une origine *cross-site* imposerait `SameSite=None` côté serveur **et** un anti-CSRF sur `/admin/auth/refresh`.

---

## 2. Authentification & session

Flux **login → 2FA → JWT** :

```
POST /admin/auth/login   { email, password }
        │  200  → un code 2FA à 6 chiffres a réellement été envoyé
        ▼  401  code:"invalid-credentials"  → email inconnu OU mot de passe faux
POST /admin/auth/verify  { email, code }
        │  401  code:"invalid-code"  → code faux, expiré, ou trop de tentatives
        ▼  200 { accessToken, tokenType:"Bearer", expiresIn:900 }
           + Set-Cookie: mc_admin_refresh=…; HttpOnly; Secure; SameSite=Strict
   → ne garder QUE l'access token (mémoire) ; le refresh est géré par le navigateur
        │  (access expire au bout de 15 min → 401)
        ▼
POST /admin/auth/refresh   (aucun corps — le cookie suffit)
        ▼  200 { nouvel accessToken }  + nouveau cookie (l'ancien est invalidé — usage unique)
```

Détails :
- **`expiresIn` = durée de vie de l'access token en *secondes* (900 = 15 min)**, ce n'est pas un timestamp absolu.
- **Refresh en cookie `HttpOnly`** : `mc_admin_refresh`, posé par `verify` et par `refresh`, `Path=/api/v1/admin/auth` (il n'est donc envoyé que sur ces deux routes). **Le JavaScript n'y a pas accès** — ne pas essayer de le lire, et ne rien stocker soi-même : c'est précisément ce qui protège la session d'une exfiltration par XSS.
- **TTL du refresh admin : 12 h** (`app.jwt.admin-refresh-ttl`), volontairement bien plus court que celui de l'app mobile (30 j). Un administrateur refait donc login + 2FA environ une fois par jour : le back-office porte des privilèges élevés et tourne souvent sur un poste partagé.
- **Rotation, usage unique** : chaque `refresh` renvoie un nouveau cookie et invalide le précédent. Un rejeu de l'ancien → `401`. Sérialiser les rafraîchissements (*single-flight*) : si plusieurs requêtes reçoivent `401` en même temps, elles doivent partager **un seul** appel à `/refresh`, sans quoi la rotation en fera échouer toutes sauf une.
- **L'access token seul est à la charge du front** : le garder en mémoire suffit, puisque la session se reconstruit au chargement via `refresh` (le cookie, lui, survit au rechargement).
- **Logout** : `POST /admin/auth/logout` — **nécessite le Bearer**, aucun corps. Invalide le refresh côté serveur et renvoie le cookie expiré (`Max-Age=0`). Idempotent.
- **Mot de passe oublié** : `POST /admin/auth/password/forgot { email }` → 200 si l'e-mail correspond à un compte (token de reset envoyé, TTL 30 min) ; **`404 not-found`** si l'e-mail est inconnu. Puis `POST /admin/auth/password/reset { token, newPassword }` (`newPassword` ≥ 10 caractères).
- **Un `200` sur `login` est un vrai succès** : il garantit qu'un code a été envoyé. N'enchaîner vers l'écran « saisir le code » que dans ce cas.
- **Échec d'identifiants** : `401` avec `code: "invalid-credentials"`. Un **email inconnu** et un **mot de passe faux** produisent une réponse **strictement identique** (même status, même `code`, même `detail`) — un test d'intégration le verrouille. Afficher un message unique du type « identifiants incorrects » : le back-end ne dit pas, et ne dira pas, lequel des deux est en cause.
- **Rate-limit login** : 10 tentatives / 15 min par email → `429 rate-limited`. C'est le garde-fou principal contre le bourrinage : prévoir un message dédié plutôt que de laisser l'utilisateur retenter en boucle.
- **2FA** : code à 6 chiffres, TTL 10 min, max 5 tentatives de `verify`. Code faux, expiré ou tentatives épuisées → `401` avec `code: "invalid-code"` (distinct de `unauthorized`) : rester sur l'écran de saisie, ne pas renvoyer au login.

> **Canal de livraison du code 2FA / reset** : en build actuel, le code est seulement *journalisé* côté serveur (`LogCodeDeliveryChannel`), pas envoyé par email/SMS. Pour tester en local, récupérer le code dans les logs du serveur. Un vrai canal sera branché avant la mise en production.

---

## 3. Conventions

### Pagination
Endpoints de liste paginés : passer `?page=0&size=20&sort=champ,desc` (paramètres Spring `Pageable`).
- Défauts : `size=20`, `sort=createdAt` (exception : historique des notifications → `sort=sentAt`).
- **Réponse enveloppée** (`PageResponse<T>`, *pas* la forme Spring `Page`) :

```json
{
  "content": [ /* … T[] … */ ],
  "page": 0,            // index de page, 0-based
  "size": 20,
  "totalElements": 137,
  "totalPages": 7
}
```

### Filtres & recherche
Passés en query params (voir chaque endpoint). Les enums se passent par leur **nom** (`?status=PUBLISHED&access=PREMIUM`). Recherche texte via `q`.

### Formats
- **Montants** : entiers en **GNF** (`amountGnf`, `priceGnf`) — jamais de décimales. Le formatage (séparateurs, « FG ») est côté front.
- **Dates/heures** : ISO-8601 UTC (`Instant`, ex. `2026-07-18T10:15:30Z`). Certaines dates sont des jours (`recordedOn` → `2026-07-18`).
- **IDs** : UUID (string).
- Réponse message simple : `{ "message": "…" }` (`MessageResponse`).

---

## 4. Gestion d'erreurs (RFC 7807)

Toutes les erreurs sont `application/problem+json` :

```json
{
  "type": "https://api.mohamedcherif.com/problems/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "Prêche introuvable.",
  "code": "not-found",
  "timestamp": "2026-07-18T10:15:30Z"   // présent sur les erreurs métier
}
```

- **Se fier à la propriété `code`** (stable, technique) pour mapper vers un message d'UI — **pas** à `detail`.
- ⚠️ `detail` contient aujourd'hui du texte français technique (écart connu, à réconcilier côté back). **Ne pas l'afficher tel quel** à l'utilisateur final : utiliser votre `i18n` indexé sur `code` (et sur le champ `errors` pour la validation).

| `code` | HTTP | Signification | Extra |
|---|---|---|---|
| `validation` | 400 | Corps/paramètres invalides | `errors: string[]` (`"champ : message"`) |
| `malformed` | 400 | Corps JSON illisible | |
| `bad-request` | 400 | Requête invalide (métier) | |
| `invalid-credentials` | 401 | **Login** : email inconnu ou mot de passe faux — réponse identique dans les deux cas | |
| `invalid-code` | 401 | **Code 2FA** faux, expiré, ou tentatives épuisées (5 max) | |
| `unauthorized` | 401 | Access token absent/expiré, refresh ou token de reset invalide | |
| `forbidden` | 403 | Authentifié mais non autorisé | |
| `not-found` | 404 | Ressource introuvable ; sur `password/forgot`, e-mail sans compte | |
| `conflict` | 409 | Conflit d'état (ex. supprimer un prêche publié, retirer le dernier SUPER_ADMIN) | |
| `unprocessable` | 422 | Règle métier non satisfaite (ex. upload invalide, publier sans média chiffré) | |
| `rate-limited` | 429 | Trop de tentatives (login) | |
| `external-dependency` | 502 | Échec d'une dépendance externe | |
| `internal` | 500 | Erreur serveur | |

**Sur `401` avec un access token expiré** : tenter un `POST /admin/auth/refresh` (sans corps, avec `credentials: 'include'`) puis rejouer la requête ; si le refresh échoue aussi → renvoyer vers l'écran de login. Un seul refresh à la fois (voir §2).

---

## 5. Référence des endpoints

> Tous les chemins ci-dessous sont préfixés par `/api/v1`. Tous exigent le Bearer admin (sauf les endpoints d'auth publics).

### 5.1 Auth — `/admin/auth`

| Méthode | Chemin | Corps requête | Réponse (200 sauf indication) |
|---|---|---|---|
| POST | `/login` | `{ email, password }` | `MessageResponse` — **401 `invalid-credentials`**, **429 `rate-limited`** |
| POST | `/verify` | `{ email, code }` | `TokenResponse` **sans `refreshToken`** + `Set-Cookie` — **401 `invalid-code`** |
| POST | `/refresh` | *(aucun — cookie)* | `TokenResponse` **sans `refreshToken`** + nouveau cookie — 401 `unauthorized` si cookie absent/invalide |
| POST | `/logout` 🔒 | *(aucun — cookie)* | `MessageResponse` + cookie expiré |
| POST | `/password/forgot` | `{ email }` | `MessageResponse` — **404 `not-found`** si e-mail inconnu |
| POST | `/password/reset` | `{ token, newPassword }` | `MessageResponse` — 401 `unauthorized` si token invalide/expiré |

Validations : `email` format email ; `code` = exactement `\d{6}` ; `newPassword` ≥ 10 caractères.
`TokenResponse` = `{ accessToken, tokenType:"Bearer", expiresIn:900 }` sur cette surface : **`refreshToken` est absent du corps** (il part en cookie). Le champ n'est pas `null`, il est réellement absent du JSON — `spring.jackson.default-property-inclusion=non_null`.

### 5.2 Prêches — `/admin/prayers`

| Méthode | Chemin | Params / Corps | Réponse |
|---|---|---|---|
| GET | `/prayers` | query `status?`, `access?`, `q?`, + pagination | `PageResponse<PrayerListItem>` — 200 |
| POST | `/prayers` | `CreatePrayerRequest` | `PrayerDetailResponse` — **201** (+ header `Location`) |
| GET | `/prayers/{id}` | — | `PrayerDetailResponse` — 200 |
| PATCH | `/prayers/{id}` | `UpdatePrayerRequest` (champs nuls = inchangés) | `PrayerDetailResponse` — 200 |
| DELETE | `/prayers/{id}` | — | **204** (**409** si le prêche est `PUBLISHED` → dépublier d'abord) |
| POST | `/prayers/{id}/audio` | `multipart/form-data`, part **`file`** | `UploadResponse` — **202** |
| GET | `/prayers/{id}/encoding` | — | `EncodingStatusResponse` — 200 (**404** si aucun job) |
| POST | `/prayers/{id}/publish` | `{ notify: boolean }` **optionnel** | `PrayerDetailResponse` — 200 |
| POST | `/prayers/{id}/unpublish` | — | `PrayerDetailResponse` — 200 |
| PATCH | `/prayers/{id}/access` | `{ access }` (`FREE`/`PREMIUM`, requis) | `PrayerDetailResponse` — 200 |
| POST | `/prayers/{id}/notify` | — | `MessageResponse` — **202** (**422** si non publié) |
| GET | `/prayers/{id}/stats` | — | `PrayerStatsResponse` — 200 |

Remarques :
- **Upload audio** : `multipart/form-data`, un seul part nommé `file`. Types acceptés : `audio/mpeg, audio/mp3, audio/wav, audio/x-wav, audio/wave, audio/mp4, audio/x-m4a, audio/m4a, application/octet-stream`. Taille max **500 Mo**. Fichier vide/trop gros/mauvais type → **422**. Déclenche le pipeline async → statut du prêche `ENCODING`. Suivre l'avancement via `GET /prayers/{id}/encoding`.
- **Publish** : le corps est *optionnel* ; la clé JSON est **`notify`** (booléen). `notify:true` envoie une notification à la publication. Exige un média chiffré (sinon **422**). Idempotent si déjà publié.
- `CreatePrayerRequest` : `title` (requis, ≤200), `theme?` (≤120), `recordedOn?` (date), `language?` (≤30), `description?`, `access?` (défaut `PREMIUM` côté serveur).
- `UpdatePrayerRequest` : `title?`, `theme?`, `recordedOn?`, `language?`, `description?`, `coverUrl?` (≤500). **Ne contient pas `access`** → utiliser `PATCH /access`.

### 5.3 Utilisateurs — `/admin/users`

| Méthode | Chemin | Params / Corps | Réponse |
|---|---|---|---|
| GET | `/users` | query `subscription?` (`active`\|`expired`\|`no-subscription`), `q?` (téléphone), + pagination | `PageResponse<UserListItem>` — 200 |
| GET | `/users/{id}` | — | `UserDetailResponse` — 200 |
| GET | `/users/{id}/payments` | pagination | `PageResponse<PaymentHistoryItem>` — 200 |
| DELETE | `/users/{id}/devices/{deviceId}` | — | **204** |
| POST | `/users/{id}/subscription/extend` | `{ days?, until? }` | `SubscriptionInfo` — 200 |
| POST | `/users/{id}/block` | — | `MessageResponse` — 200 |
| POST | `/users/{id}/unblock` | — | `MessageResponse` — 200 |

`ExtendSubscriptionRequest` : soit `days` (entier positif), soit `until` (Instant). `UserDetailResponse.subscription` peut être `null` (aucun abonnement).

### 5.4 Paiements & abonnements — `/admin`

| Méthode | Chemin | Params | Réponse |
|---|---|---|---|
| GET | `/payments` | `from?`, `to?` (ISO date-time), `method?`, `status?`, + pagination | `PageResponse<PaymentListItem>` — 200 |
| GET | `/payments/export` | `format=csv` (défaut), `from?`, `to?`, `method?`, `status?` | **`text/csv`** — 200 |
| GET | `/subscriptions/stats` | — | `SubscriptionStatsResponse` — 200 |

- **Export CSV** : réponse `text/csv`, header `Content-Disposition: attachment; filename="payments.csv"` (exposé via CORS). Entête des colonnes : `date,userPhone,plan,method,amountGnf,status,reference`. `format` autre que `csv` → **400**.
- `SubscriptionStatsResponse` = `{ monthlyRevenueGnf, activeSubscriptions, renewalRatePct }`, chacun un `MetricValue { value, change, changeLabel }`.

### 5.5 Notifications — `/admin/notifications`

| Méthode | Chemin | Params / Corps | Réponse |
|---|---|---|---|
| GET | `/notifications` | pagination (`sort=sentAt` par défaut) | `PageResponse<NotificationHistoryItem>` — 200 |
| POST | `/notifications` | `SendNotificationRequest` | `NotificationHistoryItem` — **201** |

`SendNotificationRequest` : `title` (requis, ≤200), `message` (requis, ≤1000), `target` (requis, `ALL`\|`SUBSCRIBERS`).

### 5.6 Dashboard — `/admin`

| Méthode | Chemin | Params | Réponse |
|---|---|---|---|
| GET | `/dashboard/stats` | — | `DashboardStatsResponse` — 200 |
| GET | `/dashboard/revenue` | `months?` (défaut 12) | `RevenuePoint[]` (tableau brut) — 200 |
| GET | `/dashboard/activity` | `limit?` (défaut 20) | `ActivityItem[]` (tableau brut) — 200 |
| GET | `/encoding/jobs` | `state?` (défaut : jobs en cours) | `EncodingJobItem[]` (tableau brut) — 200 |

`DashboardStatsResponse` = `{ activeUsers, activeSubscriptions, monthlyRevenueGnf, publishedPrayers }`, chacun un `MetricValue`.

### 5.7 Paramètres — `/admin/settings`

| Méthode | Chemin | Corps | Réponse |
|---|---|---|---|
| GET | `/settings/plans` | — | `PlanResponse[]` — 200 |
| PUT | `/settings/plans` | `UpdatePlansRequest` | `PlanResponse[]` — 200 |
| GET | `/settings/protection` | — | `ProtectionResponse` — 200 |
| PATCH | `/settings/protection` | `UpdateProtectionRequest` | `ProtectionResponse` — 200 |
| GET | `/settings/admins` | — | `AdminSummary[]` — 200 |
| POST | `/settings/admins` | `InviteAdminRequest` | `AdminSummary` — **201** |
| PATCH | `/settings/admins/{id}` | `UpdateAdminRoleRequest` | `AdminSummary` — 200 |
| DELETE | `/settings/admins/{id}` | — | **204** (**409** si dernier `SUPER_ADMIN`) |

- `UpdatePlansRequest` : `{ plans: [{ code(requis), priceGnf(≥0), durationDays(>0), label? }] }` (`plans` non vide).
- `UpdateProtectionRequest` : `{ maxDevicesPerAccount? (1..10), premiumValidityDays? (≥1) }` (champs nuls = inchangés). La réponse `ProtectionResponse` contient en plus `scheme` et `keyRotation` (lecture seule).
- `InviteAdminRequest` : `{ email(requis), role(requis) }`. `UpdateAdminRoleRequest` : `{ role(requis) }`.

---

## 6. Enums (valeurs exactes, sérialisées par nom)

| Enum | Valeurs |
|---|---|
| `PrayerStatus` | `DRAFT`, `ENCODING`, `PUBLISHED`, `FAILED` |
| `PrayerAccess` | `FREE`, `PREMIUM` |
| `EncodingState` | `UPLOADED`, `TRANSCODING`, `ENCRYPTING`, `READY`, `FAILED` |
| `NotificationTarget` | `ALL`, `SUBSCRIBERS` |
| `PaymentMethod` | `ORANGE_MONEY`, `MTN_MOMO`, `YMONEY`, `CARD` |
| `PaymentStatus` | `PENDING`, `SUCCESS`, `FAILED` |
| `SubscriptionStatus` | `ACTIVE`, `EXPIRED` |
| `UserStatus` | `ACTIVE`, `BLOCKED` |
| `AdminRole` | `SUPER_ADMIN`, `EDITOR` |

⚠️ **Pas d'enum** pour le code de plan (`planCode`/`plan` = String libre ; valeurs usuelles `MONTHLY`, `ANNUAL`) ni pour `device.platform` (String libre, ex. `"iOS"`, `"Android"`).

---

## 7. Types TypeScript

```ts
// ─── Enums ───────────────────────────────────────────────────────────────
export type PrayerStatus = 'DRAFT' | 'ENCODING' | 'PUBLISHED' | 'FAILED';
export type PrayerAccess = 'FREE' | 'PREMIUM';
export type EncodingState = 'UPLOADED' | 'TRANSCODING' | 'ENCRYPTING' | 'READY' | 'FAILED';
export type NotificationTarget = 'ALL' | 'SUBSCRIBERS';
export type PaymentMethod = 'ORANGE_MONEY' | 'MTN_MOMO' | 'YMONEY' | 'CARD';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED';
export type UserStatus = 'ACTIVE' | 'BLOCKED';
export type AdminRole = 'SUPER_ADMIN' | 'EDITOR';

// ─── Enveloppes ──────────────────────────────────────────────────────────
export interface PageResponse<T> {
  content: T[];
  page: number;          // 0-based
  size: number;
  totalElements: number;
  totalPages: number;
}
export interface MessageResponse { message: string; }
export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;        // technique/FR — ne pas afficher tel quel
  code: string;          // clé stable pour l'i18n
  timestamp?: string;
  errors?: string[];     // présent quand code === 'validation'
}

// ─── Auth ────────────────────────────────────────────────────────────────
export interface LoginRequest { email: string; password: string; }
export interface VerifyRequest { email: string; code: string; }        // code = 6 chiffres
export interface ForgotPasswordRequest { email: string; }
export interface ResetPasswordRequest { token: string; newPassword: string; } // ≥ 10 car.
export interface TokenResponse {
  accessToken: string;
  refreshToken?: string; // ABSENT sur la surface admin : le refresh est un cookie HttpOnly
  tokenType: 'Bearer';
  expiresIn: number;     // secondes (900)
}

// ─── Prêches ─────────────────────────────────────────────────────────────
export interface PrayerListItem {
  id: string; title: string; theme: string | null; recordedOn: string | null;
  durationSec: number; status: PrayerStatus; access: PrayerAccess; playCount: number;
}
export interface CreatePrayerRequest {
  title: string; theme?: string; recordedOn?: string; language?: string;
  description?: string; access?: PrayerAccess;
}
export interface UpdatePrayerRequest {
  title?: string; theme?: string; recordedOn?: string; language?: string;
  description?: string; coverUrl?: string;                 // pas d'`access` ici
}
export interface AccessRequest { access: PrayerAccess; }
export interface PublishRequest { notify: boolean; }        // corps optionnel
export interface UploadResponse { jobId: string; state: EncodingState; }
export interface EncodingStatusResponse { state: EncodingState; progress: number; message: string | null; }
export interface ProtectionInfo {
  encrypted: boolean; encryptionKeyId: string | null;
  keyRotatedAt: string | null; premiumValidityDays: number;
}
export interface PrayerStatsResponse {
  playCount: number; downloadCount: number; avgListenSec: number; avgListenPct: number;
}
export interface PrayerDetailResponse {
  id: string; title: string; theme: string | null; recordedOn: string | null;
  durationSec: number; language: string | null; description: string | null;
  coverUrl: string | null; status: PrayerStatus; access: PrayerAccess;
  playCount: number; downloadCount: number; publishedAt: string | null;
  createdAt: string; updatedAt: string;
  protection: ProtectionInfo; stats: PrayerStatsResponse;
}

// ─── Utilisateurs ────────────────────────────────────────────────────────
export interface UserListItem {
  id: string; displayName: string | null; phone: string; registeredAt: string;
  subscriptionStatus: string | null; expiresAt: string | null; deviceCount: number;
}
export interface SubscriptionInfo {
  planCode: string; status: SubscriptionStatus; startedAt: string; expiresAt: string;
}
export interface DeviceInfo {
  deviceId: string; label: string | null; platform: string | null;
  lastSeenAt: string; revoked: boolean;
}
export interface PaymentHistoryItem {
  date: string; plan: string; method: PaymentMethod;
  amountGnf: number; status: PaymentStatus; reference: string | null;
}
export interface UserDetailResponse {
  id: string; displayName: string | null; phone: string; status: UserStatus;
  registeredAt: string; subscription: SubscriptionInfo | null;
  devices: DeviceInfo[]; payments: PaymentHistoryItem[];
}
export interface ExtendSubscriptionRequest { days?: number; until?: string; }

// ─── Paiements / abonnements ─────────────────────────────────────────────
export interface PaymentListItem {
  date: string; userPhone: string; plan: string; method: PaymentMethod;
  amountGnf: number; status: PaymentStatus; reference: string | null;
}
export interface MetricValue { value: number; change: number; changeLabel: string; }
export interface SubscriptionStatsResponse {
  monthlyRevenueGnf: MetricValue; activeSubscriptions: MetricValue; renewalRatePct: MetricValue;
}

// ─── Notifications ───────────────────────────────────────────────────────
export interface SendNotificationRequest { title: string; message: string; target: NotificationTarget; }
export interface NotificationHistoryItem {
  id: string; title: string; message: string; target: NotificationTarget;
  sentCount: number; sentAt: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────
export interface DashboardStatsResponse {
  activeUsers: MetricValue; activeSubscriptions: MetricValue;
  monthlyRevenueGnf: MetricValue; publishedPrayers: MetricValue;
}
export interface RevenuePoint { month: string; revenueGnf: number; }   // month = "YYYY-MM"
export interface ActivityItem { type: string; text: string; meta: string | null; at: string; }
export interface EncodingJobItem { prayerId: string; title: string; state: EncodingState; progress: number; }

// ─── Paramètres ──────────────────────────────────────────────────────────
export interface PlanResponse { code: string; priceGnf: number; durationDays: number; label: string; }
export interface PlanUpdate { code: string; priceGnf: number; durationDays: number; label?: string; }
export interface UpdatePlansRequest { plans: PlanUpdate[]; }
export interface ProtectionResponse {
  scheme: string; keyRotation: string; premiumValidityDays: number; maxDevicesPerAccount: number;
}
export interface UpdateProtectionRequest { maxDevicesPerAccount?: number; premiumValidityDays?: number; }
export interface AdminSummary { id: string; name: string; email: string; role: AdminRole; }
export interface InviteAdminRequest { email: string; role: AdminRole; }
export interface UpdateAdminRoleRequest { role: AdminRole; }
```

---

## 8. Client d'exemple (`fetch`, sans dépendance)

```ts
const BASE_URL = 'http://localhost:8080/api/v1';

// --- Stockage : SEUL l'access token est manipulé ici -----------------------
// Le refresh est un cookie HttpOnly : ni lisible ni écrivable en JS, et il
// survit au rechargement de page. Ne rien mettre dans localStorage.
let accessToken: string | null = null;

export class ApiError extends Error {
  constructor(public status: number, public problem: ProblemDetail) {
    super(problem.code); // message = code stable, pour l'i18n
  }
}

// --- Refresh « single-flight » ---------------------------------------------
// La rotation est à usage unique : deux appels concurrents à /refresh avec le
// même cookie en feraient échouer un. Tous les appelants partagent donc UNE
// seule promesse.
let refreshInFlight: Promise<boolean> | null = null;

function refresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // indispensable : envoie le cookie
      });
      if (!res.ok) { accessToken = null; return false; }
      const tok = (await res.json()) as TokenResponse;
      accessToken = tok.accessToken;
      return true;
    } catch {
      accessToken = null;
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

// Au démarrage de l'app : tenter un refresh. S'il réussit, la session est
// rétablie sans re-login — c'est ce qui fait survivre le F5.
export async function restoreSession(): Promise<boolean> {
  return refresh();
}

// --- Appel bas niveau avec refresh auto sur 401 -----------------------------
async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers, credentials: 'include' });

  if (res.status === 401 && retry) {
    if (!(await refresh())) throw await toError(res); // session réellement perdue → login
    return request<T>(path, init, false);             // rejoue une fois
  }
  if (!res.ok) throw await toError(res);
  if (res.status === 204) return undefined as T;
  return res.status === 200 || res.status === 201 || res.status === 202
    ? (res.json() as Promise<T>)
    : (undefined as T);
}

async function toError(res: Response): Promise<ApiError> {
  let problem: ProblemDetail;
  try { problem = await res.json(); }
  catch { problem = { type: '', title: res.statusText, status: res.status, detail: '', code: 'internal' }; }
  return new ApiError(res.status, problem);
}

// --- Auth -------------------------------------------------------------------
// Lève ApiError(401, code:'invalid-credentials') si les identifiants sont refusés,
// et ApiError(429, code:'rate-limited') au-delà de 10 tentatives / 15 min.
// Un retour sans exception garantit qu'un code 2FA a été envoyé.
export function login(email: string, password: string) {
  return request<MessageResponse>('/admin/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) }, false);
}

// Le cookie de refresh est posé par cette réponse ; la réponse ne contient
// PAS de refreshToken. Ne pas chercher à le lire.
export async function verify(email: string, code: string) {
  const tok = await request<TokenResponse>('/admin/auth/verify',
    { method: 'POST', body: JSON.stringify({ email, code }) }, false);
  accessToken = tok.accessToken;
  return tok;
}

export async function logout() {
  try { await request<MessageResponse>('/admin/auth/logout', { method: 'POST' }, false); }
  finally { accessToken = null; } // le serveur a expiré le cookie
}

// --- Exemples métier --------------------------------------------------------
export function listPrayers(params: { status?: PrayerStatus; access?: PrayerAccess; q?: string;
                                      page?: number; size?: number; sort?: string } = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]));
  return request<PageResponse<PrayerListItem>>(`/admin/prayers?${qs}`);
}

export function uploadAudio(prayerId: string, file: File) {
  const form = new FormData();
  form.append('file', file);                 // le part DOIT s'appeler "file"
  return request<UploadResponse>(`/admin/prayers/${prayerId}/audio`, { method: 'POST', body: form });
}

export function publishPrayer(prayerId: string, notify = false) {
  return request<PrayerDetailResponse>(`/admin/prayers/${prayerId}/publish`,
    { method: 'POST', body: JSON.stringify({ notify }) }); // clé JSON = "notify"
}

// Téléchargement de l'export CSV (flux binaire, pas du JSON)
export async function exportPayments(filters: { from?: string; to?: string;
                                                 method?: PaymentMethod; status?: PaymentStatus } = {}) {
  const qs = new URLSearchParams({ format: 'csv',
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v != null)) as Record<string, string> });
  const res = await fetch(`${BASE_URL}/admin/payments/export?${qs}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, credentials: 'include' });
  if (!res.ok) throw await toError(res);
  return res.blob(); // à passer à URL.createObjectURL pour déclencher le téléchargement
}
```

---

## 9. Points d'attention

- **Échecs d'auth explicites** : `login` → `401 invalid-credentials` (email et mot de passe indiscernables), `verify` → `401 invalid-code`, `password/forgot` → `404 not-found`. N'avancer dans le flux qu'en cas de `200`.
- **Ne jamais composer un message qui désigne l'email ou le mot de passe** : le back-end ne fournit pas cette information, et l'inventer côté front recréerait la fuite que le code unique évite.
- **Ne jamais afficher `detail`** : c'est du texte technique/FR. Mapper l'UI sur `code` (et `errors` pour la validation).
- **`expiresIn` en secondes** (900), pas un timestamp — calculer l'échéance avec `Date.now() + expiresIn*1000` si besoin.
- **Refresh en cookie `HttpOnly`** : le front ne le voit pas et n'a rien à en stocker. Ne garder que l'access token, en mémoire.
- **`credentials: 'include'` sur `verify`, `refresh` et `logout`**, sinon le cookie ne part pas et la session ne se rétablit jamais.
- **Rétablir la session au démarrage** : appeler `refresh` au montage de l'app plutôt que de rediriger vers le login parce que la mémoire est vide — c'est ce qui fait survivre le F5.
- **Refresh usage unique + rotation** : sérialiser les appels concurrents (*single-flight*), sinon la rotation en fait échouer tous sauf un et déconnecte l'utilisateur.
- **Session admin de 12 h** : prévoir un retour propre au login en fin de session (l'app mobile, elle, a 30 jours).
- **Clé JSON `notify`** sur le publish (pas `notifyUsers`) ; corps optionnel.
- **Upload** : `multipart/form-data`, part `file`, ≤ 500 Mo, ne pas fixer `Content-Type` manuellement (le navigateur ajoute la boundary).
- **Filtres de dates** (`from`/`to` des paiements) au format ISO date-time.
- **Formes de réponse** : distinguer *paginé* (`PageResponse<T>` — users, payments, notifications) vs *tableau brut* (dashboard revenue/activity, encoding jobs, plans, admins) vs *objet unique* (détails, stats, protection).
- **CORS** : servir le front depuis l'origine configurée (`http://localhost:5173` par défaut).
- **Canal 2FA/reset** en dev : le code est dans les logs serveur (pas d'email/SMS réel encore).

---

> Généré à partir du code source du back-office. En cas de doute sur un champ, la source de vérité reste l'OpenAPI en direct : `http://localhost:8080/v3/api-docs`.
