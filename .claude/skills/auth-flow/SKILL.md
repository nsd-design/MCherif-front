---
name: auth-flow
description: Implémente l'authentification du back-office React/TS Mohamed Chérif — écran de connexion (email + mot de passe) puis code 2FA, stockage de l'access token en mémoire (jamais localStorage), rafraîchissement automatique, contexte d'auth, et routes protégées par rôle ADMIN. À utiliser pour la connexion, la session, les gardes de routes ou la déconnexion.
---

# Skill : auth-flow

Authentification admin en deux étapes, sécurisée côté client. Le backend reste l'autorité ; le contrôle client n'est qu'un confort UX.

## Parcours de connexion
1. **Connexion** : `email` + `mot de passe` → appel `POST /admin/auth/login`. Réponse neutre (ne pas révéler si l'email existe).
2. **2FA** : saisie du **code de vérification** → `POST /admin/auth/verify` → renvoie access + refresh.
3. Rediriger vers le tableau de bord. Message d'erreur FR sobre en cas d'échec (identifiants ou code invalide/expiré).
- Mot de passe oublié : `POST /admin/auth/password/forgot` puis `reset` via token.

## Gestion des jetons
- **Access token en mémoire** (contexte React / store), **jamais** dans `localStorage`/`sessionStorage`.
- **Refresh** : via l'endpoint dédié ; idéalement le refresh token est un **cookie httpOnly** posé par le backend (à coordonner). Rafraîchir sur 401 (voir skill **api-client**).
- **Déconnexion** : `POST /admin/auth/logout`, purge de l'état en mémoire, redirection Connexion.

## Contexte & routes protégées
- `AuthProvider` expose `{ admin, isAuthenticated, login, verify, logout }`.
- `RequireAdmin` (garde de route) : si non authentifié → redirection Connexion (en gardant l'URL cible) ; vérifier le rôle `ADMIN`.
- `AuthLayout` (écrans publics) vs `AppLayout` (sidebar/topbar, protégé).

## Sécurité
- Ne jamais logger le mot de passe, le code 2FA ni les tokens.
- Gérer 401 (refresh puis retry, sinon déconnexion) et 403 (accès refusé → message + retour).
- Ne pas persister d'info sensible entre sessions.

## Définition de terminé
- [ ] Connexion email + mot de passe → 2FA → session établie.
- [ ] Access token en mémoire ; refresh automatique ; déconnexion propre.
- [ ] Routes protégées par `RequireAdmin` ; redirection si non authentifié.
- [ ] Erreurs FR sobres ; aucun secret loggé ni stocké en clair.
