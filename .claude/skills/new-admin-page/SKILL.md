---
name: new-admin-page
description: Scaffolde une nouvelle page du back-office React/TS Mohamed Chérif — route protégée dans le layout admin, récupération des données via hooks React Query, états chargement/vide/erreur en squelettes, internationalisation FR et respect du design system. À utiliser quand on ajoute ou refond une page d'administration.
---

# Skill : new-admin-page

Créer une page cohérente avec le back-office. Toujours combiner avec **design-system** et **api-client**.

## Étapes
1. **Emplacement** : `src/pages/<domaine>/<Nom>Page.tsx` (domaines : `dashboard`, `prayers`, `publish`, `users`, `payments`, `notifications`, `settings`).
2. **Route** : enregistrer dans `routes/` sous l'`AppLayout` (sidebar + topbar), protégée par `RequireAdmin`. Ajouter l'entrée de sidebar si c'est une section de premier niveau.
3. **En-tête de page** : titre 24/800 + éventuel **bouton primaire unique** (ex. « Nouveau prêche »).
4. **Données** : via des **hooks React Query** de `api/` (jamais de `fetch` direct). Gérer filtres/recherche/pagination en query params reflétés dans l'URL si utile.
5. **États obligatoires** : chargement (**squelettes** gris animés), vide (message FR sobre), erreur (message + réessai). Jamais d'écran blanc ni de spinner plein écran.
6. **i18n** : toutes les chaînes via `i18n/` (FR). Montants/dates via `lib/`.
7. **Accessibilité** : structure sémantique, focus visible, navigation clavier.

## Composants à privilégier
`DataTable`, `StatCard`, `StatusBadge`, `FilterChips`, `Pagination`, `Modal`, `Drawer`, `TextField`, `Dropzone`, `Toast`, `Skeleton`. Créer dans `components/` si absent, plutôt que dupliquer du style.

## Définition de terminé
- [ ] Page routée sous l'AppLayout et protégée `ADMIN`.
- [ ] Données via hooks React Query ; pagination/filtres fonctionnels.
- [ ] États chargement/vide/erreur en squelettes.
- [ ] Chaînes en i18n FR ; montants/dates formatés.
- [ ] Checklist **design-system** validée ; `typecheck` et `lint` verts.
