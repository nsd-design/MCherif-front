# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Back-office Mohamed Chérif — frontend web d'administration (React / TypeScript).** Ce repo consomme l'API REST admin (repo Spring Boot séparé). Sources design : maquettes `Back-office Admin.dc.html`, `DESIGN-SYSTEM.md`, spec OpenAPI (`/v3/api-docs`).
>
> Les sections §1–§12 sont le **cahier des charges design** (la cible). Lire **§0 d'abord** : il décrit la réalité du code implémenté, qui diverge de la cible sur un point majeur (couche de données mock, pas encore d'OpenAPI).

## 0. État d'implémentation (as-built) — à lire en premier

Les 9 écrans sont **entièrement implémentés**, en thème clair **et** sombre. Ce qui suit est l'architecture réelle ; elle prime sur la cible §1–§12 en cas d'écart.

**Écart majeur — couche de données mock.** Le backend Spring Boot et sa spec OpenAPI **n'existent pas encore**. Donc, contrairement à §2/§3/§7 :
- Les types du domaine sont **écrits à la main** dans `src/types/index.ts` (provisoires), pas générés. `pnpm gen:api` est un **placeholder** (échoue tant qu'il n'y a pas de `/v3/api-docs`).
- Les données viennent de `src/api/mock/data.ts` (reprises fidèlement des maquettes), servies avec délai simulé par `src/api/mock/index.ts`.
- Le point de bascule est balisé partout par le marqueur **`// TODO(api):`** — c'est là qu'on remplacera les mocks par les appels `openapi-fetch` et les types générés.

**Gestionnaire de paquets : `pnpm`** (présence de `pnpm-lock.yaml`). **React 19** (le brief dit « 18+ »).

**Câblage (nécessite de lire plusieurs fichiers) :**
- `src/main.tsx` → `src/app/App.tsx` monte l'ordre des providers : `ThemeProvider` > `QueryClientProvider` (`app/queryClient.ts`) > `RouterProvider` (`app/router.tsx`).
- `app/router.tsx` : `/connexion` sous `AuthLayout` ; tout le reste sous `ProtectedRoute` (`app/ProtectedRoute.tsx`, redirige si non authentifié) > `AppLayout` (`routes/layouts/`, sidebar + colonne de contenu). Routes en français (`/tableau-de-bord`, `/preches`, `/preches/:id`, `/publication`, `/utilisateurs`, `/abonnements`, `/notifications`, `/parametres`).
- **Données** : chaque page appelle un hook de `src/api/hooks.ts` (TanStack Query, clés dans `queryKeys`) — **jamais de fetch direct**. `src/api/client.ts` est un wrapper fetch + intercepteur JWT/refresh **prêt mais non branché**.
- **Auth** : `src/store/auth.ts` (Zustand) simule connexion → 2FA (code à **6 chiffres**), pose l'access token **en mémoire** via `setAccessToken` de `api/client.ts` (jamais localStorage).
- **Thème** : `theme/tokens.css` définit toutes les couleurs en variables CSS (`:root` clair + `[data-theme="dark"]`). `theme/tokens.ts` est le **miroir JS** des couleurs (seul `.ts` autorisé à contenir des hex) pour les consommateurs qui exigent une chaîne (Recharts, pastilles de paiement). `ThemeProvider` pose `data-theme` sur `<html>` et **persiste le thème en localStorage** (le thème n'est pas sensible ; les jetons, si).

**Garde-fous « aucune couleur en dur » (bloquants au lint) :**
- ESLint `no-restricted-syntax` interdit les littéraux hex dans les `.tsx` (exception : `src/theme/tokens.ts`).
- Stylelint `color-no-hex` interdit les hex dans les `*.module.css` (exception : `src/theme/tokens.css`).
- La bulle d'aperçu de notification est volontairement sombre dans les deux thèmes → tokens dédiés `--notif-*`.

**Patron d'une page** : `<TopBar title=… actions=… />` puis `<PageBody>` (zone défilable, padding 32) ; données via un hook `api/`, états de chargement en `<Skeleton>` / `<SkeletonRows>` (jamais de spinner). Le styling est en **CSS Modules** co-localisés (`X.tsx` + `X.module.css`).

**Structure réelle notable** (au-delà de §4) : `src/store/` (auth Zustand), `src/routes/layouts/` (AppLayout/AuthLayout), `src/api/mock/` + `src/api/hooks.ts` + `src/api/client.ts`. Composants transverses clés : `DataTable` (TanStack Table), `StatusBadge` (badges typés par domaine), `SegmentedControl`, `Dropzone` + `ProgressSteps`, `Drawer`, `ConfirmModal`, `RevenueChart` (Recharts, couleurs depuis `tokens.ts` selon le thème courant).

**Commandes** (vérifiées) : `pnpm dev` · `pnpm build` (`tsc -b && vite build`) · `pnpm typecheck` (`tsc --noEmit -p tsconfig.app.json`) · `pnpm lint` (ESLint **+** stylelint des `.module.css`). `pnpm test` (Vitest) est déclaré mais **aucun test n'est encore écrit**. `tsconfig.app.json` active `noUnusedLocals`/`noUnusedParameters` — pas d'import ni de variable inutilisés.

## 1. Mission

Interface web d'administration (desktop) permettant à l'équipe Mohamed Chérif de : téléverser et publier des prêches (avec suivi d'encodage/chiffrement), gérer les utilisateurs, les abonnements et paiements (Djomy), envoyer des notifications et suivre des statistiques.

**C'est un SPA React/TS qui ne fait QUE de l'UI + des appels à l'API.** Aucune logique métier sensible côté client : les droits, la protection du contenu et les activations sont décidés par le back-end. Le front applique et affiche.

## 2. Contraintes non négociables

- **Réutiliser le design system existant à l'identique** (mêmes tokens couleurs clair/sombre, typo Manrope, accent vert unique, rayons, espacements) — adapté aux usages **desktop** (sidebar, tableaux denses). Voir §5 et la skill **design-system**.
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
| Tests | **Vitest** + React Testing Library ; (option **Playwright** pour l'e2e) |
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

## 5. Design system (résumé — détail dans `DESIGN-SYSTEM.md` + skill design-system)

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
- Toute chaîne visible via `i18n/` (FR). Formatage GNF/dates via `lib/`.
- États **chargement/vide/erreur** obligatoires, en **squelettes** (jamais de spinner plein écran).
- Accessibilité : labels ARIA, focus visible, navigation clavier dans les tables et modales.

## 8. Contrat de présentation — ce SPA possède tout le texte affiché

**Le backend ne renvoie jamais de phrase FR « prête à afficher ».** Il renvoie des **codes/enums** (`status: "PUBLISHED"`, `method: "ORANGE_MONEY"`, un `errorCode` en cas d'erreur RFC 7807…). C'est **ce frontend** — pas le backend — qui possède l'intégralité du texte affiché : libellés d'interface statiques (déjà en `i18n/`) **et** traduction de ces codes serveur en français.

- Maintenir dans `i18n/` un **dictionnaire code → libellé FR** par domaine (statuts de prêche, statuts d'abonnement, moyens de paiement, `errorCode` d'API) — utilisé par `StatusBadge` et les messages d'erreur.
- Les erreurs API (RFC 7807) portent un `errorCode` stable ; **ne jamais afficher `detail`** (texte technique de debug) à l'admin — toujours passer par le dictionnaire de traduction, avec un message de repli générique si le code est inconnu.
- Le **contenu libre** saisi par l'admin ou d'autres admins (titre/description de prêche, titre/message de notification) n'est pas traduit : affiché tel quel.
- Ce dictionnaire de traduction est le **même besoin** que côté app mobile (repo séparé) : les deux frontends traduisent indépendamment les mêmes codes serveur — pas de partage de code entre repos, mais garder les libellés FR cohérents entre l'app et le back-office.

## 9. Sécurité (côté client)

- **Access token en mémoire uniquement** ; **jamais** dans `localStorage`/`sessionStorage`. Refresh via l'endpoint dédié (idéalement cookie httpOnly).
- **Routes protégées** : rediriger vers Connexion si non authentifié ; vérifier le rôle `ADMIN`. Le backend reste l'autorité — le contrôle client n'est qu'un confort UX.
- Ne jamais logger de token ni de donnée sensible. Gérer proprement le 401 (refresh puis retry, sinon déconnexion) et le 403.
- Respecter le CORS du backend (origine configurée par variable d'environnement `VITE_API_BASE_URL`).

## 10. Commandes

```bash
pnpm install
pnpm run dev            # serveur de dev Vite
pnpm run gen:api        # génère les types depuis l'OpenAPI (openapi-typescript)
pnpm run lint           # ESLint (dont règle anti-couleur-en-dur)
pnpm run typecheck      # tsc --noEmit
pnpm run test           # Vitest + Testing Library
pnpm run build          # build de production
```

## 11. À faire / À éviter

**À faire :** dériver tout style des tokens · générer les types depuis l'OpenAPI · gérer chargement/vide/erreur en squelettes · protéger les routes · formater GNF/dates via `lib/` · recréer le rendu des maquettes proprement · traduire les codes/enums via `i18n/`.

**À éviter :** une 2e couleur d'accent · texte < 11 px · couleurs en dur · stocker des tokens dans `localStorage` · inventer des endpoints · dupliquer les types de l'API · copier le DOM des prototypes · afficher un `detail` d'erreur brut au lieu de l'`errorCode` traduit.

## 12. Index des skills (dans `skills/`, à copier dans `.claude/skills/` du repo)

- **design-system** — appliquer tokens, thèmes clair/sombre, Manrope et composants desktop.
- **api-client** — générer le client typé depuis l'OpenAPI, hooks React Query, intercepteur JWT/refresh.
- **auth-flow** — connexion email + mot de passe + 2FA, gestion des jetons en mémoire, routes protégées.
- **new-admin-page** — scaffolder une page admin (route, layout, données, états, i18n).
- **data-table** — tableaux TanStack (tri, filtres, pagination, densité, badges de statut) conformes au design.
- **forms** — formulaires React Hook Form + Zod, champs conformes, erreurs FR.
- **file-upload** — dropzone d'upload audio + suivi d'encodage (étapes/progression) pour la publication.
