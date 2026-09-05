---
name: auth-flow
description: Implémente et modifie l'authentification du back-office React/TS Mohamed Chérif — connexion e-mail + mot de passe puis code 2FA à 6 chiffres, erreurs d'auth explicites (invalid-credentials / invalid-code / rate-limited), jetons access ET refresh en mémoire, rafraîchissement sur 401, store Zustand et garde de route. À utiliser pour la connexion, le mot de passe oublié, la session, les gardes de routes ou la déconnexion.
---

# Skill : auth-flow

Authentification admin en deux étapes. **Le backend est l'autorité** ; le contrôle client n'est qu'un confort UX.

Contrat de référence : `src/docs/apiBackoffice.md` §2, §4 et §5.1. En cas d'écart, c'est ce document qui tranche, pas ce skill.

## Fichiers réels

| Rôle | Fichier | Symbole |
|---|---|---|
| Appels d'auth | `src/api/auth.ts` | `login`, `verify`, `logout`, `forgotPassword`, `resetPassword`, `fetchCurrentAdmin` |
| État de session | `src/store/auth.ts` | `useAuthStore` (**Zustand**, pas un `AuthProvider`) |
| Jetons | `src/api/tokenStore.ts` | `setTokens`, `clearTokens`, `getAccessToken`, `getRefreshToken` |
| Client HTTP | `src/api/http.ts` | `api`, `unwrap`, `ApiError`, `setSessionExpiredHandler` |
| Garde de route | `src/app/ProtectedRoute.tsx` | `ProtectedRoute` (**pas** `RequireAdmin`) |
| Écrans | `src/pages/auth/` | `LoginPage`, `ResetPasswordPage` |
| Messages d'erreur | `src/i18n/errors.ts` | `errorMessage`, `errorMessageFor` |

Le store expose `{ admin, isAuthenticated, pendingTwoFa, loginEmail, login, verifyTwoFa, logout, resetFlow }`.

## Parcours de connexion

1. **Connexion** — `email` + `mot de passe` → `POST /admin/auth/login`.
   **Un 200 est un vrai succès** : il garantit qu'un code 2FA a été envoyé. N'avancer vers l'écran de saisie du code que dans ce cas.
2. **2FA** — code à **6 chiffres**, TTL **10 minutes**, **5 tentatives** maximum → `POST /admin/auth/verify` → renvoie access + refresh.
3. Rediriger vers le tableau de bord.

- **Pas d'endpoint `/me`** : le profil admin est retrouvé via `GET /settings/admins` filtré sur l'e-mail (`fetchCurrentAdmin`), avec repli sur l'e-mail seul. Le `role` peut donc être `null` même pour un admin légitime.
- **Mot de passe oublié** : `POST /admin/auth/password/forgot`, puis `password/reset` avec le token reçu (TTL 30 min, `newPassword` ≥ 10 caractères).
- **En dev, aucun e-mail ni SMS n'est envoyé** : le code 2FA et le token de reset sont **journalisés dans les logs du backend** (`LogCodeDeliveryChannel`).

## Erreurs d'auth — explicites, jamais neutres

Le backend ne renvoie **plus** de réponses neutres. Chaque échec porte un `code` stable ; le mapper via `src/i18n/errors.ts`, jamais afficher `detail`.

| Endpoint | Statut + `code` | Comportement d'UI attendu |
|---|---|---|
| `/login` | 401 `invalid-credentials` | Rester sur l'écran mot de passe, message unique « Identifiants invalides. » |
| `/login` | 429 `rate-limited` | Message dédié : 10 essais / 15 min par e-mail |
| `/verify` | 401 `invalid-code` | **Rester sur l'écran de saisie du code** — ne jamais renvoyer au login |
| `/password/forgot` | 404 `not-found` | « Aucun compte n'est associé à cette adresse. » |
| `/password/reset` | 401 `unauthorized` | « Lien invalide ou expiré. » |

**Règle absolue** : sur `invalid-credentials`, un e-mail inconnu et un mot de passe faux produisent une réponse **strictement identique** (même statut, même `code`, même `detail`) — verrouillé par un test d'intégration côté backend. **Ne jamais composer un message qui désigne l'e-mail *ou* le mot de passe** : le backend ne fournit pas cette information et l'inventer côté front recréerait la fuite que le code unique évite.

Utiliser `errorMessageFor(err, { … })` pour les nuances propres à un écran ; `errorMessage(err)` suffit ailleurs. Toujours un repli générique si le code est inconnu.

## Gestion des jetons

- **Access ET refresh en mémoire** (`tokenStore.ts`, variables de module) — **jamais** `localStorage`/`sessionStorage`. Le backend renvoie le refresh **dans le corps de la réponse** ; il n'y a **pas** de cookie httpOnly.
- Conséquence assumée : **la session est perdue au rechargement de page** (re-login).
- **Rotation à usage unique** : après chaque `verify`/`refresh`, remplacer les **deux** jetons via `setTokens`.
- `expiresIn` est une **durée en secondes** (900 = 15 min), pas un timestamp.
- **Refresh sur 401** en un seul vol, puis rejeu une fois ; échec → purge + `sessionExpiredHandler` → retour `/connexion`.
- ⚠️ **Les endpoints `/admin/auth/*` sont exclus du mécanisme refresh/rejeu** (`isAuthEndpoint` dans `http.ts`). Leurs 401 sont métier, pas des sessions expirées : les rejouer consommerait silencieusement une des 5 tentatives de vérification.

## Garde de route — ce qu'elle fait réellement

`ProtectedRoute` teste **uniquement** `isAuthenticated` et redirige vers `/connexion` sinon.

Ce qu'elle ne fait **pas**, contrairement à ce que laisse entendre CLAUDE.md §9 :
- elle **ne vérifie pas le rôle** `ADMIN` — c'est le backend qui tranche, en 403 ;
- elle **ne mémorise pas l'URL cible** : après connexion on atterrit toujours sur `/tableau-de-bord`.

Ne pas « corriger » cela à la légère : faute d'endpoint `/me`, le rôle vient de `fetchCurrentAdmin()` qui renvoie `null` si l'appel échoue — un contrôle client strict bloquerait alors un admin légitime.

`AuthLayout` porte les écrans publics, `AppLayout` (sidebar + topbar) les écrans protégés.

## Sécurité

- Ne jamais logger le mot de passe, le code 2FA ni les jetons.
- Ne jamais afficher `detail` : mapper l'UI sur `code`.
- Gérer 403 (accès refusé → message + retour) distinctement de 401.
- Ne rien persister de sensible entre deux sessions (le thème, lui, va en `localStorage` — pas les jetons).

## Définition de terminé

- [ ] Connexion → 2FA → session ; on n'atteint l'écran code **que** sur un 200.
- [ ] Chaque code d'erreur du tableau ci-dessus produit son message FR ; aucun repli générique sur les cas d'auth connus.
- [ ] Un `invalid-code` laisse l'utilisateur sur l'écran de saisie.
- [ ] Aucun message ne distingue e-mail inconnu et mot de passe faux.
- [ ] Access et refresh en mémoire ; rotation appliquée ; déconnexion propre.
- [ ] Aucun refresh déclenché par un 401 d'un endpoint `/admin/auth/*`.
- [ ] Aucun secret loggé ni stocké ; aucun `detail` brut à l'écran.
