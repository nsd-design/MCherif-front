# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Back-office Mohamed Chérif — frontend web d'administration (React / TypeScript).** Ce repo consomme l'API REST admin (repo Spring Boot séparé).
>
> **Sources de vérité présentes dans le repo** : `src/theme/tokens.css` (design system implémenté), `src/docs/apiBackoffice.md` (contrat d'API rédigé pour ce front), `src/api/generated/schema.d.ts` (spec OpenAPI générée), et les skills `.claude/skills/`.
>
> **Maquettes d'origine** : `Back-office Admin.dc.html`, `Mohamed Chérif App.dc.html` et `DESIGN-SYSTEM.md` sont dans **`MCherif-Design-backend.zip`** à la racine — présent sur disque mais **gitignoré** (donc absent d'un clone frais). Les consulter en dézippant dans un dossier temporaire. Attention : ce zip couvre **deux produits** — le back-office (ce repo) *et* l'app mobile (repo séparé) ; ne pas appliquer au back-office une spec qui décrit l'écran mobile.
>
> Les sections §1–§12 sont le **cahier des charges design** (la cible). Lire **§0 d'abord** : il décrit la réalité du code implémenté.

## 0. État d'implémentation (as-built) — à lire en premier

Les 9 écrans sont **entièrement implémentés** (thème clair **et** sombre) et **branchés sur l'API admin réelle** (backend Spring Boot, `src/docs/apiBackoffice.md`). Ce qui suit est l'architecture réelle ; elle prime sur §1–§12 en cas d'écart.

**Couche API réelle (openapi-fetch typé).**
- Types **générés** depuis l'OpenAPI : `pnpm gen:api` → `src/api/generated/schema.d.ts` ; alias exposés dans `src/api/types.ts` (**ne jamais réécrire un type d'API à la main**). Nécessite le backend accessible sur `http://localhost:8080` pour régénérer.
- Client typé dans `src/api/http.ts` : `baseUrl = VITE_API_BASE_URL` — **vide par défaut**, donc les appels partent en **relatif same-origin** (`/api/v1/...`) et c'est le **proxy de dev Vite** qui relaie vers le backend (voir Env ci-dessous). Un **`querySerializer` aplati le `pageable` Spring** en `page/size/sort`. Erreurs `application/problem+json` → **`ApiError`** (jamais afficher `detail` ; mapper `code` → FR via `src/i18n/errors.ts`).
- **Toute réponse passe par `unwrap()`** (`http.ts`) : renvoie `data` ou lève une `ApiError`. Ne jamais lire `result.data` d'openapi-fetch directement — un statut d'erreur passerait inaperçu.
- Hooks TanStack Query **par ressource** : `src/api/{prayers,users,payments,notifications,dashboard,settings}.ts` — **jamais de fetch direct dans les pages** ; invalidation du cache après mutation, via des fabriques de clés (`prayerKeys`, etc.).
- **Tous les champs des schémas générés sont optionnels** (le backend n'annote rien `required`) : les composants doivent gérer `undefined`/`null` (`data?.content ?? []`, repli `'—'` dans `i18n/enums.ts`). Ne pas « corriger » cela en réécrivant les types à la main.
- Trois écarts au patron « tout en hook », volontaires et à conserver :
  - **Assistant de publication** — `createPrayer` / `uploadAudioFile` / `setPrayerAccess` / `publishPrayerById` sont **impératifs** (l'id n'existe qu'en cours de séquence) ; l'upload multipart passe par un `bodySerializer` qui construit le `FormData` (**ne pas fixer `Content-Type`**).
  - **Suivi d'encodage** — `useEncodingStatus` poll toutes les 1,5 s et s'arrête aux états terminaux `READY`/`FAILED`.
  - **Export CSV** — `exportPaymentsCsv` lit la réponse en `blob` (`parseAs: 'blob'`), extrait le nom depuis `Content-Disposition` et déclenche le téléchargement ; pas de hook.
- Pagination : enveloppe `PageResponse<T>` (`content` / `page` / `size` / `totalElements` / `totalPages`), pages **indexées à 0**.

**Sécurité des jetons.** L'**access token** est en mémoire seule (`src/api/tokenStore.ts`) ; le **refresh est un cookie `HttpOnly`** (`mc_admin_refresh`, `Secure`, `SameSite=Strict`, `Path=/api/v1/admin/auth`) posé par le backend — **le JS n'y a pas accès**, ne jamais tenter de le lire. `credentials: 'include'` est donc obligatoire (posé par défaut sur le client). Sur **401** : refresh en un seul vol puis rejeu une fois ; échec → purge + redirection `/connexion`. **Exception : les 401 de `/admin/auth/*` sont métier** et exclus du refresh/rejeu (`isAuthEndpoint`).

**La session survit au rechargement** : `bootstrap()` (`store/auth.ts`, déclenché par `App.tsx`) rejoue `POST /admin/auth/refresh` au montage. Le store porte un statut **tri-valué** `pending | authenticated | anonymous` — `ProtectedRoute` affiche un squelette tant qu'on est `pending`, sinon le F5 renverrait au login avant la réponse serveur. TTL du refresh admin : **12 h**. Seule donnée persistée : **l'e-mail** (`localStorage['mc-admin-email']`, pas un secret), faute d'endpoint `/me`, pour reconstruire le profil après un F5. **Aucun jeton en localStorage.**

⚠️ **L'OpenAPI du backend est en retard sur ce contrat** : il déclare encore un `RefreshRequest` obligatoire pour `/refresh` et `/logout`, alors que le serveur ignore ce corps et lit le cookie (vérifié en direct). Ces deux appels passent donc en `fetch` brut plutôt que par le client typé — ne pas « corriger » cela en régénérant les types.

**Gestionnaire de paquets : `pnpm`** (présence de `pnpm-lock.yaml`). **React 19** (le brief dit « 18+ »).

**Câblage (nécessite de lire plusieurs fichiers) :**
- `src/main.tsx` → `src/app/App.tsx` : providers `ThemeProvider` > `QueryClientProvider` (`app/queryClient.ts`, ne rejoue pas les 4xx) > `RouterProvider` (`app/router.tsx`) + `<Toaster>`.
- `app/router.tsx` : `/connexion` et `/mot-de-passe/reinitialiser` sous `AuthLayout` ; tout le reste sous `ProtectedRoute` (`app/ProtectedRoute.tsx`) > `AppLayout` (`routes/layouts/`). Routes FR (`/tableau-de-bord`, `/preches`, `/preches/:id`, `/publication`, `/utilisateurs`, `/abonnements`, `/notifications`, `/parametres`).
- **Auth** : `src/store/auth.ts` (Zustand) + `src/api/auth.ts` — connexion e-mail + mot de passe → 2FA (code **6 chiffres**, envoyé par **e-mail** ; en dev il est seulement **journalisé dans les logs du backend**) → session. **Pas d'endpoint `/me`** : le profil admin est retrouvé via `GET /settings/admins` (repli sur l'email).
  - ⚠️ **Ne pas confondre avec l'OTP à 4 chiffres** : celui-ci appartient à l'**app mobile** (repo séparé) — connexion par **téléphone + SMS**, sans mot de passe, composant « 4 cases » du `DESIGN-SYSTEM.md`. Sa surface REST **n'est pas encore exposée** par le backend. Le back-office n'utilise que le 2FA e-mail à 6 chiffres (`\d{6}` selon `src/docs/apiBackoffice.md`). *Nuance : l'OpenAPI généré ne porte aucune contrainte sur `VerifyRequest.code`, et l'UI n'impose pas de longueur minimale (`slice(0, 6)` est un plafond) — si le backend admin passait à 4 chiffres, seuls les textes visibles seraient à corriger (`i18n/fr.ts`, hint et placeholder de `LoginPage.tsx`).*
- **Traduction des codes serveur** (le backend ne renvoie que des enums/codes) : `src/i18n/enums.ts` (enums → libellés FR, utilisé par `StatusBadge`/`PaymentBadge`) et `src/i18n/errors.ts` (`ProblemDetail.code` → message FR + `errorMessageFor(error, overrides)` pour un message contextuel par action, utilisés par `ErrorState` et les toasts). Les deux ont un **repli générique** : ne jamais afficher un code brut ni un `detail`.
- **Portée réelle de `src/i18n/fr.ts`** : il ne contient que le transverse (`nav`, `auth`, `common`, `status`) ; les libellés propres à une page sont des **littéraux FR en ligne dans le `.tsx`**. C'est la convention en place — suivre le fichier voisin plutôt que d'y centraliser toutes les chaînes au coup par coup (§7 décrit la cible).
- **Feedback** : `src/store/toast.ts` + `src/components/Toaster.tsx` pour succès/erreurs de mutation.
- **Env & proxy de dev** (`.env` non versionné ; `.env.example` versionné) — le point le plus contre-intuitif du repo :
  - `VITE_API_BASE_URL` : **laisser vide en dev**. Le front appelle `/api/...` en same-origin et `vite.config.ts` proxifie vers `VITE_API_PROXY_TARGET` (défaut `http://localhost:8080`). Le proxy **retire l'en-tête `Origin`** pour que le backend ne traite pas l'appel comme une requête CORS — ses endpoints publics d'auth n'ont pas de config CORS. Conséquence : **pas de CORS à gérer en dev**, contrairement à ce que décrit `src/docs/apiBackoffice.md` (rédigé avant le proxy).
  - En prod, renseigner `VITE_API_BASE_URL` seulement si l'API est sur une autre origine — le backend doit alors autoriser cette origine (`ADMIN_WEB_ORIGIN`, une seule autorisée).
- **Thème** : `theme/tokens.css` (variables CSS `:root` clair + `[data-theme="dark"]`). `theme/tokens.ts` = **miroir JS** des couleurs (seul `.ts` autorisé à contenir des hex) pour Recharts et pastilles de paiement. `ThemeProvider` pose `data-theme` sur `<html>` et **persiste le thème en localStorage** (le thème n'est pas sensible ; les jetons, si).

**Garde-fous « aucune couleur en dur » (bloquants au lint) :**
- ESLint `no-restricted-syntax` interdit les littéraux hex dans les `.tsx` (exception : `src/theme/tokens.ts`).
- Stylelint `color-no-hex` interdit les hex dans les `*.module.css` (exception : `src/theme/tokens.css`).
- La bulle d'aperçu de notification est volontairement sombre dans les deux thèmes → tokens dédiés `--notif-*`.

**Patron d'une page** : `<TopBar title=… actions=… />` puis `<PageBody>` (zone défilable, padding 32) ; données via un hook `api/`, états de chargement en `<Skeleton>` / `<SkeletonRows>` (jamais de spinner). Le styling est en **CSS Modules** co-localisés (`X.tsx` + `X.module.css`).

**Structure réelle notable** (au-delà de §4) : `src/store/` (auth + toast Zustand), `src/routes/layouts/` (AppLayout/AuthLayout), `src/api/` (client `http.ts`, `tokenStore.ts`, `types.ts`, `generated/`, un module par ressource). Composants transverses clés : `DataTable` (TanStack Table), `StatusBadge`/`PaymentBadge` (typés par domaine, libellés via `i18n/enums`), `SegmentedControl`, `Dropzone` + `ProgressSteps`, `Drawer`, `Modal`/`ConfirmModal`, `Toaster`, `ErrorState`, `RevenueChart` (Recharts, couleurs depuis `tokens.ts` selon le thème courant).

**Commandes réellement définies** (`package.json`) : `pnpm dev` · `pnpm build` (`tsc -b && vite build`) · `pnpm preview` · `pnpm typecheck` (`tsc --noEmit -p tsconfig.app.json`) · `pnpm lint` (ESLint **+** stylelint des `.module.css`) · `pnpm gen:api`.

**Il n'y a aucune infrastructure de test.** Pas de script `test`, pas de Vitest ni de Testing Library dans les dépendances (§3 et §10 les listent comme *cible*, pas comme existant). Avant d'écrire un test, il faut d'abord installer et configurer le harnais. **La vérification courante est donc `pnpm typecheck && pnpm lint`** — les deux passent actuellement (un seul warning connu et sans gravité : `react-hooks/incompatible-library` sur `useReactTable` dans `DataTable.tsx`).

`tsconfig.app.json` active `noUnusedLocals`/`noUnusedParameters` — pas d'import ni de variable inutilisés, sinon le build casse.

**`pnpm gen:api` ne fonctionne pas tel quel sous Windows.** Le script utilise une substitution POSIX (`${VITE_API_BASE_URL:-http://localhost:8080}`) que pnpm **n'interprète pas** sur win32 (vérifié : la chaîne est passée littéralement). Sur cette machine, régénérer avec la commande explicite :
```bash
pnpm exec openapi-typescript http://localhost:8080/v3/api-docs -o src/api/generated/schema.d.ts
```
Nécessite le backend démarré. `src/api/generated/` est exclu d'ESLint.

## 1. Mission

Interface web d'administration (desktop) permettant à l'équipe Mohamed Chérif de : téléverser et publier des prêches (avec suivi d'encodage/chiffrement), gérer les utilisateurs, les abonnements et paiements (Djomy), envoyer des notifications et suivre des statistiques.

**C'est un SPA React/TS qui ne fait QUE de l'UI + des appels à l'API.** Aucune logique métier sensible côté client : les droits, la protection du contenu et les activations sont décidés par le back-end. Le front applique et affiche.

## 2. Contraintes non négociables

- **Réutiliser le design system existant à l'identique** (mêmes tokens couleurs clair/sombre, typo Manrope, accent vert unique, rayons, espacements) — adapté aux usages **desktop** (sidebar, tableaux denses). Voir §5, `src/theme/tokens.css` et la skill **design-system**.
- **Aucune valeur de style en dur** : couleurs, espacements, rayons, tailles viennent **toujours** des tokens. **Ne jamais introduire de nouvelle couleur.**
- **Interface 100 % en français**, ton sobre et professionnel, **sans emoji**.
- **Ne jamais réinventer l'API** : tous les appels passent par le **client typé généré depuis l'OpenAPI** du backend. Si un endpoint manque, le signaler — ne pas inventer d'URL.
- **Sécurité des jetons** : access token **en mémoire** (jamais dans `localStorage`) ; refresh géré via l'endpoint dédié (idéalement cookie httpOnly posé par le backend). Routes protégées par rôle `ADMIN`.
- **Taille de police minimum 11 px** ; montants formatés `10 000 GNF` (espace insécable) ; dates FR `12 juin 2026`.
- **Recréer le rendu des maquettes, pas copier leur DOM** : reproduire l'aspect visuel avec des composants React propres.

## 3. Stack technique

| Domaine | Choix |
|---|---|
| Build | **Vite** + **React 18+** + **TypeScript** (strict) |
| Routing | **React Router** (routes protégées par rôle) |
| État serveur | **TanStack Query** (React Query) — cache, invalidation, pagination |
| État UI local | Hooks / store léger (**Zustand**) si nécessaire |
| Client API | **OpenAPI → types** (`openapi-typescript`) + fetch typé (`openapi-fetch`) ; intercepteur JWT/refresh |
| Tableaux | **TanStack Table** (headless), stylé via tokens |
| Formulaires | **React Hook Form** + validation **Zod** |
| Graphiques | **Recharts** (courbe revenus du dashboard) |
| Styling | **Tokens en variables CSS** + **CSS Modules** ; `ThemeProvider` clair/sombre via `data-theme` |
| Polices | **Manrope** (self-host ou Google Fonts) |
| Tests | **Vitest** + React Testing Library ; (option **Playwright** pour l'e2e) — **cible, rien d'installé à ce jour (§0)** |
| Qualité | ESLint (règle anti-couleur-en-dur) + Prettier + `tsc --noEmit` |

## 4. Structure du repo (cible)

```
src/
  app/                 # entrée, providers (theme, query, router, auth), garde de routes
  routes/              # définition des routes + layouts (AppLayout avec sidebar/topbar, AuthLayout)
  pages/
    auth/              # Connexion (email + mot de passe + 2FA)
    dashboard/         # Tableau de bord (stats, revenus, activité, encodage)
    prayers/           # Catalogue, Détail/édition
    publish/           # Upload + suivi d'encodage + publication
    users/             # Liste + drawer détail (appareils, paiements)
    payments/          # Transactions + export CSV + stats
    notifications/     # Historique + envoi
    settings/          # Plans, protection (Voie B), administrateurs, thème
  components/          # Sidebar, TopBar, StatCard, DataTable, StatusBadge, Dropzone,
                       # Modal, Drawer, TextField, FilterChips, Pagination, Toast, Skeleton
  api/                 # client généré (openapi) + wrapper + hooks de requêtes (React Query)
  theme/               # tokens (variables CSS clair/sombre), ThemeProvider, useTheme
  lib/                 # format GNF/dates, helpers
  i18n/                # chaînes FR
  types/               # types partagés (dérivés de l'OpenAPI)
```

## 5. Design system (résumé — détail dans `src/theme/tokens.css` + skill design-system)

Mêmes tokens que l'app mobile, **adaptés au desktop**.

- **Thème clair par défaut**, thème sombre disponible.
- **Un seul accent : le vert** (`primary #0E7A45` clair / `#35A46C` sombre). Jamais deux accents sur un écran.
- Couleurs clair : `bg #F6F5F2`, `surface #FFFFFF`, `border #E7E5E0`, `divider #ECEAE4`, `text #17201B`, `textMuted #6B7570`, `textFaint #9AA39D`, `primarySoft #E4F1E9`, `danger #B23A3A`.
- Couleurs sombre : `bg #121714`, `surface #1B221D`, `border/divider #2A332D`, `text #F2F4F1`, `primary #35A46C`, `primarySoft rgba(53,164,108,0.14)`.
- Statuts (badges pilules teintés) : publié/actif/succès = `primary` ; encodage/en attente = ambre ; brouillon/inactif = `textMuted` ; échec/expiré = `danger`.
- Typo **Manrope** (400/600/700/800). Titre page 24 · stat 24–28 · sections 18–20 · CTA/nav 15 · corps/cellules 13–14 · méta 12 · badges 11. **Min 11 px.**
- Rayons : boutons/champs 14 · cartes/panneaux 16–18 · vignettes 12 · pilules 999. Espacement grille de 4. Padding zone de contenu 32.
- **Aucune ombre** sur cartes/tables ordinaires (distinction par `surface` + `border`) ; ombre douce sur modales/menus.

Patterns desktop : **sidebar fixe** (item actif = fond `primarySoft` + texte `primary` + barre verte) ; **top bar** (recherche globale + avatar admin) ; **DataTable** (en-tête 700 MAJUSCULES 11 px, lignes séparées par `divider`, survol `primarySoft` léger, hauteur ≥ 48) ; **StatCard** ; **StatusBadge** ; **Dropzone** avec progression multi-étapes ; **Modal** ; **Drawer** latéral (détail user/prêche).

## 6. Écrans

Connexion (email + mot de passe + **code 2FA**) · Tableau de bord (4 stats + courbe revenus + activité + encodage en cours) · Prêches (catalogue filtrable/paginé) · Publication/Upload (dropzone + étapes Téléversé→Transcodage→Chiffrement→Prêt + accès Gratuit/Premium + notifier) · Détail prêche (métadonnées, état de protection, stats, publier/dépublier) · Utilisateurs (liste + drawer : appareils avec **révoquer**, historique paiements, prolonger/bloquer) · Abonnements & paiements (transactions Djomy, filtres, export CSV, stats) · Notifications (historique + composition + aperçu) · Paramètres (plans 10 000/100 000 GNF, protection Voie B en lecture, administrateurs & rôles, thème).

## 7. Conventions de code

- **TypeScript strict**, pas de `any`. Les types des entités viennent de l'**OpenAPI** (générés), pas réécrits à la main.
- Composants fonctionnels + hooks ; un composant par fichier (PascalCase).
- **Aucune couleur/espacement en dur** hors `theme/` ; un lint doit bloquer les hex bruts.
- Données serveur via **hooks React Query** (`useQuery`/`useMutation`) dans `api/` ; pas de `fetch` direct dans les pages.
- Toute chaîne visible en FR (cible : centralisée dans `i18n/` ; réalité actuelle en §0). **Tout montant, date, durée ou nombre affiché passe par `lib/format.ts`** (`formatGnf`, `formatNumber`, `formatDateFr`, `formatDateShort`, `formatDuration`, `formatMonth`, `formatSignedNumber`) — ces helpers posent les **espaces insécables** exigés par §2 ; ne pas formater à la main ni appeler `toLocaleString` dans une page.
- États **chargement/vide/erreur** obligatoires, en **squelettes** (jamais de spinner plein écran).
- Accessibilité : labels ARIA, focus visible, navigation clavier dans les tables et modales.

## 8. Contrat de présentation — ce SPA possède tout le texte affiché

**Le backend ne renvoie jamais de phrase FR « prête à afficher ».** Il renvoie des **codes/enums** (`status: "PUBLISHED"`, `method: "ORANGE_MONEY"`, un `errorCode` en cas d'erreur RFC 7807…). C'est **ce frontend** — pas le backend — qui possède l'intégralité du texte affiché : libellés d'interface statiques (déjà en `i18n/`) **et** traduction de ces codes serveur en français.

- Maintenir dans `i18n/` un **dictionnaire code → libellé FR** par domaine (statuts de prêche, statuts d'abonnement, moyens de paiement, `errorCode` d'API) — utilisé par `StatusBadge` et les messages d'erreur.
- Les erreurs API (RFC 7807) portent un `errorCode` stable ; **ne jamais afficher `detail`** (texte technique de debug) à l'admin — toujours passer par le dictionnaire de traduction, avec un message de repli générique si le code est inconnu.
- Le **contenu libre** saisi par l'admin ou d'autres admins (titre/description de prêche, titre/message de notification) n'est pas traduit : affiché tel quel.
- Ce dictionnaire de traduction est le **même besoin** que côté app mobile (repo séparé) : les deux frontends traduisent indépendamment les mêmes codes serveur — pas de partage de code entre repos, mais garder les libellés FR cohérents entre l'app et le back-office.

## 9. Sécurité (côté client)

- **Access token en mémoire uniquement** ; **jamais** dans `localStorage`/`sessionStorage`. *As-built (§0) : le refresh est un **cookie `HttpOnly`** posé par le backend, inaccessible au JS — c'est ce qui fait survivre la session au rechargement sans l'exposer au XSS.*
- **Routes protégées** : rediriger vers Connexion si non authentifié. Le backend reste l'autorité — le contrôle client n'est qu'un confort UX. *As-built : `ProtectedRoute` ne teste que `isAuthenticated` ; il **ne vérifie pas le rôle** et ne mémorise pas l'URL cible (le rôle vient de `GET /settings/admins`, faute d'endpoint `/me`, et peut être `null`). Le rôle est tranché par le backend en 403.*
- Ne jamais logger de token ni de donnée sensible. Gérer proprement le 401 (refresh puis retry, sinon déconnexion) et le 403. **Exception : les 401 de `/admin/auth/*` sont métier** (`invalid-credentials`, `invalid-code`, token de reset invalide), pas des sessions expirées — ils sont exclus du refresh/rejeu et affichent leur propre message.
- Respecter le CORS du backend (origine configurée par variable d'environnement `VITE_API_BASE_URL`).

## 10. Commandes

```bash
pnpm install
pnpm dev               # serveur de dev Vite (5173) + proxy /api vers le backend
pnpm typecheck         # tsc --noEmit -p tsconfig.app.json
pnpm lint              # ESLint (anti-hex) + stylelint des *.module.css
pnpm build             # tsc -b && vite build
pnpm preview           # sert le build de production
pnpm gen:api           # types OpenAPI — CASSÉ sous Windows, voir §0 pour la commande de repli
```

**Vérification avant de rendre un changement : `pnpm typecheck && pnpm lint`.** `pnpm test` n'existe pas (aucun harnais de test installé — voir §0) ; ne pas l'invoquer ni prétendre l'avoir lancé.

## 11. À faire / À éviter

**À faire :** dériver tout style des tokens · générer les types depuis l'OpenAPI · gérer chargement/vide/erreur en squelettes · protéger les routes · formater GNF/dates via `lib/` · recréer le rendu des maquettes proprement · traduire les codes/enums via `i18n/`.

**À éviter :** une 2e couleur d'accent · texte < 11 px · couleurs en dur · stocker des tokens dans `localStorage` · inventer des endpoints · dupliquer les types de l'API · copier le DOM des prototypes · afficher un `detail` d'erreur brut au lieu de l'`errorCode` traduit.

## 12. Index des skills (installées dans `.claude/skills/`)

- **design-system** — appliquer tokens, thèmes clair/sombre, Manrope et composants desktop.
- **api-client** — générer le client typé depuis l'OpenAPI, hooks React Query, intercepteur JWT/refresh.
- **auth-flow** — connexion email + mot de passe + 2FA, gestion des jetons en mémoire, routes protégées.
- **new-admin-page** — scaffolder une page admin (route, layout, données, états, i18n).
- **data-table** — tableaux TanStack (tri, filtres, pagination, densité, badges de statut) conformes au design.
- **forms** — formulaires React Hook Form + Zod, champs conformes, erreurs FR.
- **file-upload** — dropzone d'upload audio + suivi d'encodage (étapes/progression) pour la publication.
