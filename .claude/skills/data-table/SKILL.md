---
name: data-table
description: Construit les tableaux de données du back-office React/TS Mohamed Chérif avec TanStack Table — colonnes typées, tri, filtres (chips), recherche, pagination serveur, badges de statut, densité et survol conformes au design system. À utiliser pour toute liste tabulaire (prêches, utilisateurs, transactions, notifications, administrateurs).
---

# Skill : data-table

Les tableaux sont au cœur du back-office. Un composant `DataTable` générique, stylé via tokens, réutilisé partout.

## Fondations
- **TanStack Table** (headless) : définir les colonnes typées à partir des types **OpenAPI** (voir skill **api-client**).
- Rendu stylé via **design-system** : en-tête 700 **MAJUSCULES 11 px** letter-spacing 0.04em ; lignes séparées par `divider` ; survol `primary-soft` léger ; hauteur ≥ 48 ; cellules 13–14.

## Fonctionnalités
- **Pagination serveur** : piloter `page`/`size`/`sort` via l'API ; afficher « N éléments · page X sur Y » et les contrôles ‹ 1 2 … ›.
- **Tri** serveur sur les colonnes pertinentes.
- **Filtres** : `FilterChips` (Tous / Publiés / Brouillons / En encodage / Gratuits / Premium, etc. selon la ressource) + recherche `q`. Refléter dans l'URL si utile.
- **Badges de statut** via `StatusBadge` (publié/actif=primary, encodage/attente=ambre, brouillon=muted, échec/expiré=danger).
- **Cellules spéciales** : vignette (photo du Cheick), montants `10 000 GNF`, dates FR, pastilles moyens de paiement (Orange Money `#FF7900`, MTN `#FFCC00`, Y Money, carte).
- **Actions de ligne** : menu `⋮` (éditer, publier/dépublier, supprimer…) ou boutons ; confirmations destructives via `Modal`.
- **Rangée cliquable** ouvrant un `Drawer` de détail quand pertinent (utilisateurs, prêches).

## États
- Chargement : **lignes squelettes** (pas de spinner). Vide : message FR sobre. Erreur : message + réessai.

## Accessibilité
- Table sémantique, en-têtes associés, tri annoncé, navigation clavier, focus visible.

## Définition de terminé
- [ ] `DataTable` générique typé (colonnes issues de l'OpenAPI), stylé via tokens.
- [ ] Pagination + tri + filtres + recherche côté serveur fonctionnels.
- [ ] Badges de statut, montants GNF, dates FR, pastilles paiement corrects.
- [ ] États chargement (squelettes)/vide/erreur ; actions destructives confirmées.
- [ ] Accessible au clavier ; densité conforme (≥ 48).
