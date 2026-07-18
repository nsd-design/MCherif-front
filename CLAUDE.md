# CLAUDE.md — Back-office Mohamed Chérif (Front React / TypeScript)

> Fichier de contexte pour l'agent de code. À lire en entier avant toute implémentation.
> Ce repo est **le frontend web du back-office d'administration**. Il consomme l'**API REST admin** (repo Spring Boot séparé). Sources : maquettes `Back-office Admin.dc.html`, `DESIGN-SYSTEM.md`, et la spec OpenAPI de l'API (`/v3/api-docs`).

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

## 8. Sécurité (côté client)

- **Access token en mémoire uniquement** ; **jamais** dans `localStorage`/`sessionStorage`. Refresh via l'endpoint dédié (idéalement cookie httpOnly).
- **Routes protégées** : rediriger vers Connexion si non authentifié ; vérifier le rôle `ADMIN`. Le backend reste l'autorité — le contrôle client n'est qu'un confort UX.
- Ne jamais logger de token ni de donnée sensible. Gérer proprement le 401 (refresh puis retry, sinon déconnexion) et le 403.
- Respecter le CORS du backend (origine configurée par variable d'environnement `VITE_API_BASE_URL`).

## 9. Commandes

```bash
npm install
npm run dev            # serveur de dev Vite
npm run gen:api        # génère les types depuis l'OpenAPI (openapi-typescript)
npm run lint           # ESLint (dont règle anti-couleur-en-dur)
npm run typecheck      # tsc --noEmit
npm run test           # Vitest + Testing Library
npm run build          # build de production
```

## 10. À faire / À éviter

**À faire :** dériver tout style des tokens · générer les types depuis l'OpenAPI · gérer chargement/vide/erreur en squelettes · protéger les routes · formater GNF/dates via `lib/` · recréer le rendu des maquettes proprement.

**À éviter :** une 2e couleur d'accent · texte < 11 px · couleurs en dur · stocker des tokens dans `localStorage` · inventer des endpoints · dupliquer les types de l'API · copier le DOM des prototypes.

## 11. Index des skills (dans `skills/`, à copier dans `.claude/skills/` du repo)

- **design-system** — appliquer tokens, thèmes clair/sombre, Manrope et composants desktop.
- **api-client** — générer le client typé depuis l'OpenAPI, hooks React Query, intercepteur JWT/refresh.
- **auth-flow** — connexion email + mot de passe + 2FA, gestion des jetons en mémoire, routes protégées.
- **new-admin-page** — scaffolder une page admin (route, layout, données, états, i18n).
- **data-table** — tableaux TanStack (tri, filtres, pagination, densité, badges de statut) conformes au design.
- **forms** — formulaires React Hook Form + Zod, champs conformes, erreurs FR.
- **file-upload** — dropzone d'upload audio + suivi d'encodage (étapes/progression) pour la publication.
