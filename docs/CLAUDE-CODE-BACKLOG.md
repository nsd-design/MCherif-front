# Backlog d'implémentation — Front React + TypeScript
> Issu du test utilisateur + audit de code du 2026-09-03 (back-office `mcherif-front` + API `mohamed_cherif_back`).
> Chaque tâche est un prompt autonome à donner à Claude Code. Ordre = ordre d'exécution recommandé.

## Règles d'ingénierie applicables à TOUTES les tâches

À rappeler à Claude Code dans chaque session :

- **DRY** : trois pages (`PrayersListPage`, `UsersPage`, `PaymentsPage`) répètent aujourd'hui le même triptyque état de filtre + recherche débouncée + pagination, et trois composants (`Modal`, `ConfirmModal`, `Drawer`) réimplémentent le même portail avec overlay et touche Échap. Toute tâche qui touche à l'un de ces endroits factorise au lieu de dupliquer une quatrième fois.
- **SOLID** : la couche `src/api/*.ts` est la seule à connaître les routes HTTP ; les pages consomment des hooks, jamais `fetch` ni `api.GET` directement. Un composant de `src/components` reste générique — aucune règle métier ne descend dedans.
- **Typage** : `strict` sans `any` (état actuel : zéro `any`, à préserver). Les types viennent de `src/api/generated/schema.d.ts` via `src/api/types.ts` — ne jamais redéclarer à la main un DTO serveur.
- **Sécurité** : l'access token reste en mémoire (`src/api/tokenStore.ts`), jamais dans `localStorage`/`sessionStorage` ni dans une URL. Le refresh reste un cookie `HttpOnly` géré par le serveur. Aucun `dangerouslySetInnerHTML`. Toute garde d'interface est un confort d'UX, jamais une mesure de sécurité — l'autorisation reste serveur.
- **Accessibilité** : tout élément interactif est un `<button>`/`<a>` réel, atteignable au clavier, avec un nom accessible. Toute icône seule porte un `aria-label` ; toute icône décorative porte `aria-hidden`.
- **Pas d'affordance morte** : un contrôle visible est soit fonctionnel, soit retiré. Aucun bouton, en-tête cliquable ou menu ne doit exister « en attendant ».
- **Vérification** : `pnpm typecheck && pnpm lint` doivent passer. À partir de F-12, `pnpm test` également.

---

# P0 — Anomalies bloquantes constatées au test

## F-01. Boucle de requêtes infinie : la page Abonnements ne s'affiche jamais

**Problème constaté (reproduit au test).** Sur `/abonnements`, le tableau des paiements reste indéfiniment en squelette de chargement et le navigateur émet des requêtes `GET /api/v1/admin/payments?from=…` **en continu, à raison d'une toutes les ~9 ms**. Extrait du journal réseau, horodatages du paramètre `from` sur cinq requêtes consécutives : `…38.764Z`, `…38.773Z`, `…38.782Z`, `…38.792Z`, `…38.801Z`.

**Cause exacte.** `src/pages/payments/PaymentsPage.tsx:44-48` construit l'objet `filters` **à chaque rendu**, en appelant `periodFrom(period)` (défini l.30-34) qui retourne `new Date().toISOString()` — donc une valeur à la milliseconde près, différente à chaque rendu. Cet objet est passé tel quel à `usePayments`, et `paymentKeys.list(filters)` (`src/api/payments.ts:17`) en fait la `queryKey`. Nouvelle clé à chaque rendu → TanStack Query considère qu'il s'agit d'une requête inédite → nouveau `fetch` + nouvel état → nouveau rendu → nouvelle clé. La requête n'atteint jamais l'état `success`, donc `isLoading` reste vrai et le tableau n'est jamais rendu. C'est à la fois un bug fonctionnel total sur la page et une charge inutile permanente sur le backend.

**À faire.**
1. Stabiliser la borne temporelle : calculer `from` avec `useMemo` dépendant de `[period]`, et **tronquer à la journée** (`d.setHours(0,0,0,0)`) — la précision milliseconde n'a aucun sens fonctionnel pour un filtre « 30 derniers jours » et empêche toute mise en cache.
2. Mémoïser `filters` (`useMemo` sur `[period, method, status]`).
3. Rendre la clé de requête robuste par construction : dans `src/api/payments.ts`, ne plus sérialiser l'objet `filters` brut mais une clé normalisée aux champs explicitement listés et ordonnés.
4. Auditer les autres hooks au même motif (`src/api/prayers.ts`, `src/api/users.ts`, `src/api/notifications.ts`) : aucune valeur non déterministe (`Date.now`, `new Date`, littéral d'objet non mémoïsé, fonction fléchée) ne doit entrer dans une `queryKey`.
5. Ajouter une règle ESLint ou, à défaut, un commentaire de convention en tête de `src/api/http.ts` : *une queryKey ne contient que des valeurs primitives stables*.

**Critères d'acceptation.** Au chargement de `/abonnements`, exactement une requête `GET /api/v1/admin/payments` est émise ; le tableau s'affiche ; changer de période ou de filtre en émet une seule de plus. Test de régression (cf. F-12) avec un serveur simulé comptant les appels.

## F-02. Sondage du tableau de bord sans condition d'arrêt

**Problème constaté.** `GET /api/v1/admin/encoding/jobs` est appelé toutes les 5 secondes tant que `/tableau-de-bord` est ouvert — y compris lorsque la carte affiche « Aucun encodage en cours », c'est-à-dire lorsqu'il n'y a rien à surveiller. Un back-office laissé ouvert une journée émet plusieurs milliers de requêtes inutiles.

**Cause exacte.** `src/api/dashboard.ts:48` : `refetchInterval: 5000` est une constante. Le hook voisin `useEncodingStatus` (`src/api/prayers.ts:118-121`) fait pourtant les choses correctement, avec une fonction qui renvoie `false` sur un état terminal.

**À faire.** Aligner `useEncodingJobs` sur ce modèle : `refetchInterval` devient une fonction qui renvoie `false` quand la liste retournée est vide ou ne contient que des états terminaux, et l'intervalle sinon. Le sondage doit donc redémarrer automatiquement dès qu'un job apparaît (le tableau de bord est déjà invalidé après une publication) — vérifier ce redémarrage explicitement, c'est le point délicat du correctif.

**Critères d'acceptation.** Sans job en cours, aucune requête récurrente. Avec un job actif, sondage toutes les 5 s, arrêt automatique dès `READY`/`FAILED`.

---

# P1 — Fonctionnalités manquantes ou affordances mortes

## F-03. Le rôle de l'administrateur connecté est codé en dur

**Problème constaté.** Le pied de la barre latérale affiche toujours « Super administrateur », quel que soit le compte connecté : `src/components/Sidebar.tsx:63` contient la chaîne littérale, alors que `admin.role` est disponible et que `adminRoleLabel()` (`src/i18n/enums.ts:71-75`) existe déjà et est utilisé ailleurs. Un `EDITOR` se voit annoncer un rôle qu'il n'a pas.

**À faire.** Remplacer par `adminRoleLabel(admin?.role)` avec un repli neutre. Vérifier au passage que `fetchCurrentAdmin` renseigne bien le rôle dans le store.

## F-04. Aucune adaptation de l'interface au rôle (RBAC UI)

**Problème constaté.** `src/app/ProtectedRoute.tsx` ne vérifie que `status === 'authenticated'` — aucun contrôle de rôle, ni par route ni par action. Un `EDITOR` voit et peut déclencher exactement les mêmes commandes qu'un `SUPER_ADMIN` : inviter un administrateur, en retirer un, modifier les plans tarifaires. Le serveur les refusera **une fois la tâche B-01 livrée** — aujourd'hui il les accepte. L'utilisateur découvre l'interdiction par un message d'erreur après coup, ce qui est une mauvaise expérience même une fois le serveur corrigé.

**À faire.**
1. Étendre `ProtectedRoute` avec une prop optionnelle de rôles autorisés, et une redirection explicite (page « accès refusé ») plutôt qu'un renvoi silencieux vers le tableau de bord.
2. Introduire un hook unique `useCan(action)` (source de vérité unique pour les règles d'affichage — pas de test `role === 'SUPER_ADMIN'` disséminé dans les pages) et l'utiliser pour masquer, dans `SettingsPage`, les actions réservées.
3. Traiter le `403` de manière dédiée dans `src/api/http.ts` : message explicite plutôt que le libellé générique de `src/i18n/errors.ts:18`.

**Dépendance.** À livrer avec B-01 côté serveur ; l'ordre importe peu, mais l'interface ne doit jamais être présentée comme la protection.

## F-05. `ProtectedRoute` perd la destination demandée

**Problème constaté.** Une session expirée sur `/preches/{id}` renvoie vers `/connexion` sans mémoriser l'URL cible (`src/app/ProtectedRoute.tsx`, `<Navigate to="/connexion" replace />` sans `state`). Après reconnexion, `LoginPage.tsx:56` renvoie systématiquement vers `/tableau-de-bord`.

**À faire.** Transmettre `state={{ from: location }}`, le lire dans `LoginPage` et y revenir après connexion, avec repli sur `/tableau-de-bord`. N'accepter que des chemins internes (rejeter toute valeur absolue ou externe) pour éviter une redirection ouverte.

## F-06. Affordances mortes : tri des colonnes et menu d'actions

**Problème constaté (reproduit au test).** Dans `/preches`, les en-têtes « Titre », « Thème », « Date », « Durée », « Statut », « Accès », « Écoutes » sont rendus comme des boutons cliquables — cliquer sur « Date » ne produit **ni tri, ni requête**. En bout de ligne, une icône « trois points » suggère un menu contextuel qui **n'existe pas** : le clic ne fait rien. Même situation dans `/utilisateurs`.

**Cause.** `DataTable` (`src/components/DataTable.tsx:44-68`) implémente réellement le tri via `useReactTable`/`getSortedRowModel`, mais **toutes** les colonnes de `PrayersListPage`, `UsersPage` et `PaymentsPage` déclarent `enableSorting: false` ; le bouton d'en-tête reste rendu (et seulement `disabled`, sans indication visuelle claire). Les « trois points » sont un `<span>` décoratif sans gestionnaire, ni `<button>`, ni `aria-label` (`PrayersListPage.tsx:145-149`, `UsersPage.tsx:124-128`).

**À faire — deux décisions à trancher explicitement, pas à contourner.**
1. **Tri.** Le paramètre serveur existe déjà et est câblé jusqu'à l'appel (`PrayerFilters.sort`, `src/api/prayers.ts:69-87`) mais aucune page ne l'alimente. Activer le tri **serveur** sur les colonnes que l'API sait trier : remonter l'état de tri de `DataTable` vers la page, l'injecter dans les filtres, réinitialiser la page à 0 à chaque changement. Sur les colonnes non triables côté serveur, ne pas rendre le bouton du tout — un en-tête non triable doit être du texte, pas un bouton désactivé.
2. **Menu d'actions.** Soit implémenter le menu (les actions existent déjà côté API : publier, dépublier, changer l'accès, notifier, supprimer — cf. `src/api/prayers.ts`), en `<button>` avec `aria-label`, ouverture au clavier, fermeture sur Échap et clic extérieur ; soit **retirer l'icône**. Ne pas la laisser en place.

## F-07. Fonctions serveur existantes sans interface

**Problème constaté.** Quatre capacités sont entièrement disponibles mais inaccessibles à l'utilisateur — le hook est écrit, jamais appelé :

| Capacité | Hook / composant mort | Constat à l'écran |
|---|---|---|
| Modifier la configuration DRM | `useUpdateProtection` (`src/api/settings.ts:41`) | `/parametres` affiche « Configuration DRM — **LECTURE SEULE** » alors que `PATCH /admin/settings/protection` existe et fonctionne |
| Changer le rôle d'un administrateur | `useUpdateAdminRole` (`src/api/settings.ts:67`) | `/parametres` ne propose qu'Inviter et Retirer |
| Statistiques d'un prêche | `usePrayerStats` (`src/api/prayers.ts:103`) | la page de détail lit `prayer.stats` ; le hook dédié est du code mort |
| Badge d'état d'un utilisateur | `UserStatusBadge` (`src/components/StatusBadge.tsx:65`) | aucun badge « Actif / Bloqué » dans la liste ni le tiroir ; l'état ne se devine qu'au libellé du bouton |

**À faire.** Pour chacune : brancher l'interface manquante, ou supprimer le code mort. Priorité au premier cas (configuration DRM éditable, réservée au `SUPER_ADMIN` via `useCan`, cf. F-04) et au dernier (le badge d'état est une information de sécurité que l'administrateur doit voir dans la liste). Livrer les deux autres ou les supprimer — ne pas laisser d'export inutilisé.

## F-08. Variations des indicateurs affichées en double

**Problème constaté (reproduit au test).** Les cartes d'indicateurs affichent `+2 +2 ce mois`, `0 +0 ce mois`, `0 +0 vs mois dernier`, `0 0 %`.

**Cause.** Le serveur renvoie un `changeLabel` **déjà formaté avec la valeur** (`DashboardService.java:76-79` : `formatDelta(newUsers) + " ce mois"`), et `changeText` côté front (`src/pages/dashboard/DashboardPage.tsx:15-19`, dupliqué dans `src/pages/payments/PaymentsPage.tsx:25-28`) préfixe une seconde fois `formatSignedNumber(m.change)`.

**À faire.** Coordonner avec B-11 : le serveur renvoie `value`, `change` et un `changeKind` énuméré ; le front produit le libellé français. Placer cette fonction **une seule fois** dans `src/i18n/` ou `src/lib/format.ts` — pas une copie par page — et l'utiliser dans les deux écrans. Dans l'attente de B-11, corriger a minima le doublon en n'affichant que `changeLabel`.

## F-09. Colonne DATE vide sur des prêches publiés

**Problème constaté.** `/preches` affiche `—` en colonne DATE pour un prêche pourtant publié, et `0 min` en durée. La réponse serveur ne contient effectivement ni date ni durée exploitable : `{"id":"…","title":"Amantu Billahi","theme":"Foi","durationSec":0,"status":"PUBLISHED","access":"FREE","playCount":0}` — `recordedOn` est absent. La page de détail affiche pourtant « Publié le 18 juillet 2026 ».

**À faire.** Après B-12 (ajout de `publishedAt`/`createdAt` au DTO de liste) : afficher la date de publication pour un prêche publié, la date de création pour un brouillon, et ne recourir à `—` que si les trois valeurs sont absentes. La durée à `0 min` relève de B-09 côté serveur — ne rien maquiller côté front.

## F-10. Manques fonctionnels ponctuels

À traiter en un lot :

- **Renvoi du code 2FA.** La clé `fr.auth.resend` (« Renvoyer le code », `src/i18n/fr.ts:35`) existe mais aucun bouton ne l'utilise : l'écran de vérification (`LoginPage.tsx:152-184`) n'offre aucun moyen de redemander un code, alors que la validité est de 10 minutes. Ajouter le bouton, avec un délai d'attente avant réactivation et un compte à rebours visible.
- **Historique des notifications non paginé.** `NotificationsPage.tsx:21` appelle `useNotifications(0, 20)` avec une page figée — les envois au-delà des 20 premiers sont inatteignables. Ajouter l'état de page et le composant `Pagination`, comme sur les autres listes.
- **Durée de prolongation figée.** `UserDrawer.tsx:141` envoie toujours `{ days: 30 }` alors que `useExtendSubscription` accepte `days` ou `until` (`src/api/users.ts:66-78`). Proposer un choix (30 / 90 / 365 jours ou une date), avec confirmation récapitulative.
- **Recherche globale inerte.** Le champ de recherche de la barre supérieure (`TopBar.tsx:29-35`, `showSearch` activé par `DashboardPage.tsx:44`) est monté sans `value` ni `onChange` : taper dedans ne déclenche rien. Soit l'implémenter, soit le retirer du tableau de bord.
- **Bouton « Changer » de la pochette sans action.** `PublishPage.tsx:272` — aucun `onClick`, et aucun endpoint de pochette n'existe côté serveur. Retirer le bouton, ou ouvrir une tâche serveur dédiée. La vignette `/cheick.jpeg` est par ailleurs codée en dur pour **chaque** ligne de la liste des prêches (`PrayersListPage.tsx:74-79`) : à remplacer par une vraie vignette ou un espace réservé neutre.
- **Échec silencieux du chargement du profil.** `fetchCurrentAdmin` (`src/api/auth.ts:107-113`) intercepte l'erreur et renvoie `null` sans trace ni message : si l'appel échoue après connexion, l'administrateur reste connecté avec un nom et un rôle vides, sans aucune indication. Afficher un message discret et permettre un nouvel essai.
- **Validation d'upload côté client.** `Dropzone.tsx` annonce « 500 Mo max » sans rien vérifier ; l'erreur ne remonte qu'après le transfert complet (`PublishPage.tsx:111-116`). Vérifier type MIME et taille avant l'envoi.
- **Accent manquant.** « a chaque publication » → « à chaque publication » (`/parametres`, section DRM).

## F-11. Accessibilité

**Problèmes constatés.**
- Les lignes de tableau cliquables sont des `<tr>` porteurs d'un `onClick` (`DataTable.tsx:83`) : non focalisables, non activables au clavier, sans rôle. Le tiroir utilisateur et la page de détail d'un prêche sont donc **inatteignables sans souris**.
- `Modal`, `ConfirmModal` (`Modal.tsx:14-99`) et `Drawer` (`Drawer.tsx:14-42`) déclarent `role="dialog"` et `aria-modal="true"` mais ne déplacent pas le focus à l'ouverture, ne le piègent pas, et ne le restituent pas à la fermeture.
- Icônes « trois points » sans `<button>` ni `aria-label` (cf. F-06).

**À faire.** Rendre la navigation clavier complète : cellule ou bouton focalisable comme point d'entrée de la ligne (préférable à un `<tr>` avec `tabIndex` et `role="button"`, qui reste un contournement) ; piège de focus mutualisé pour les trois surfaces modales — ce qui rejoint directement F-13.

---

# P2 — Dette technique et qualité

## F-12. Aucun test automatisé

**Problème constaté.** Aucun script `test` dans `package.json`, aucune dépendance de test, aucun fichier `*.test.ts(x)` dans `src/`. La seule vérification actuelle est `pnpm typecheck && pnpm lint`. Les deux anomalies P0 ci-dessus (boucle infinie, sondage sans fin) sont précisément le type de défaut qu'un test de comptage de requêtes détecte immédiatement.

**À faire.** Installer Vitest + Testing Library + MSW. Couvrir dans cet ordre : (1) régression F-01 — le montage de `PaymentsPage` n'émet qu'une requête ; (2) régression F-02 — pas de sondage sans job actif ; (3) `src/api/http.ts` — rafraîchissement unique et mutualisé sur 401, purge de session sur échec ; (4) `ProtectedRoute` ; (5) le hook de pagination issu de F-13. Ajouter les scripts `test` et `test:watch`, et brancher `pnpm typecheck && pnpm lint && pnpm test` en pré-commit ou en CI.

## F-13. Factorisations à réaliser (DRY)

**Problèmes constatés.**
- `PrayersListPage`, `UsersPage` et `PaymentsPage` répètent le même ensemble : états `filter`/`search`/`page`, `useDebouncedValue`, dérivation `rows`/`totalPages`/`totalElements`, remise à zéro de la page au changement de filtre. C'est aussi ce copier-coller qui a laissé passer F-01 dans une seule des trois pages.
- `Modal`, `ConfirmModal` et `Drawer` réimplémentent chacun portail + overlay + écoute de la touche Échap + `stopPropagation`.
- Les définitions de colonnes (date, statut, badges) sont redéclarées dans chaque page.
- `changeText` est dupliqué entre `DashboardPage.tsx:15-19` et `PaymentsPage.tsx:25-28`.

**À faire.** Extraire trois abstractions, sans modifier le comportement observable :
1. `usePagedResource` — filtre, recherche débouncée, page, remise à zéro, clé de requête normalisée (c'est l'endroit où la règle de F-01 devient structurelle et non plus une vigilance individuelle).
2. `OverlayShell` (ou `useOverlay`) — portail, overlay, Échap, piège de focus (couvre F-11).
3. Une fabrique de colonnes partagées (`columns/date`, `columns/status`) dans `src/components`.

Puis migrer les trois pages dessus. Livrer en plusieurs commits — une abstraction par commit, tests à l'appui.

## F-14. Divers

- Commentaire obsolète référençant `api/mock/data.ts`, fichier supprimé (`src/i18n/fr.ts:3-4`).
- Clés i18n mortes : `fr.common.edit`, `fr.common.delete` (`src/i18n/fr.ts:48-49`) — et `fr.auth.resend` tant que F-10 n'est pas livré.
- Route de repli `path: '*'` qui redirige vers le tableau de bord (`src/app/router.tsx`) : préférer une vraie page « introuvable », une URL erronée étant aujourd'hui indistinguable d'une navigation normale.
- Convention i18n à trancher : `src/i18n/fr.ts` ne porte que le transverse, les libellés métier sont des littéraux dans les `.tsx` (`PaymentsPage.tsx:190-221`, `PublishPage.tsx:239-256`). C'est le choix en place et il est cohérent tant que l'application reste monolingue — le documenter explicitement dans `CLAUDE.md` pour qu'il reste un choix et non un accident.
