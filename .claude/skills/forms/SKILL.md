---
name: forms
description: Construit les formulaires du back-office React/TS Mohamed Chérif avec React Hook Form + Zod — champs conformes au design system, validation typée, messages d'erreur FR, soumission via mutations React Query. À utiliser pour la création/édition de prêche, l'envoi de notification, l'édition des plans, l'invitation d'administrateur, etc.
---

# Skill : forms

Formulaires cohérents, validés et accessibles. Toujours combiner avec **design-system** et **api-client**.

## Fondations
- **React Hook Form** pour l'état et la soumission ; **Zod** pour le schéma de validation (typé, source de vérité).
- Dériver, quand c'est possible, la forme des données des types **OpenAPI** afin de rester aligné avec l'API.

## Champs (design system)
- `TextField`, `TextArea`, `Select`, `Toggle`, `RadioGroup`, `DatePicker` : fond `surface`, bordure `border`, focus **1.5 px `primary`**, placeholder `text-faint`, radius 14.
- Libellés clairs en FR ; aide contextuelle en `text-muted` ; erreurs de champ en `danger` sous le champ.
- **Un seul bouton primaire** de soumission ; action secondaire neutre (ex. « Enregistrer en brouillon »).

## Validation & erreurs
- Valider à la soumission (et au blur pour les champs clés). Messages **FR sobres**, jamais de brut technique.
- Mapper les erreurs **RFC 7807** renvoyées par l'API sur les champs concernés (erreurs 422) ou en toast global.
- Montants saisis en **GNF entiers** (pas de décimales) ; normaliser avant envoi.

## Soumission
- Via une **mutation React Query** (`useMutation`) du module `api/` ; à la réussite, invalider les caches concernés et afficher un `Toast` de succès ; gérer l'état de chargement du bouton (désactivé + libellé).

## Cas notables
- **Prêche** : titre, thème, date, langue, description, accès (Gratuit/Premium), notifier à la publication. L'upload audio est géré par la skill **file-upload**.
- **Notification** : titre, message, cible (Tous/Abonnés) + aperçu.
- **Plans** : tarifs Mensuel/Annuel en GNF. **Administrateur** : email + rôle.

## Définition de terminé
- [ ] Schéma Zod typé ; champs conformes au design system.
- [ ] Validation + messages FR ; erreurs API (422/RFC 7807) mappées aux champs.
- [ ] Soumission via mutation + invalidation + toast ; bouton en état de chargement.
- [ ] Montants en GNF entiers ; accessible (labels, focus, clavier).
