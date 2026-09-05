---
name: api-client
description: Met en place et utilise le client API typé du back-office React/TS Mohamed Chérif — génération des types depuis la spec OpenAPI du backend Spring Boot, wrapper fetch typé, intercepteur JWT (access en mémoire) avec refresh automatique, et hooks TanStack Query par ressource. À utiliser pour tout appel à l'API admin ou ajout d'une nouvelle requête serveur.
---

# Skill : api-client

Le front ne parle à l'API **que** via un client typé généré depuis l'OpenAPI. On n'invente jamais d'URL ni de type.

## Génération des types
- Source : la spec OpenAPI du backend (`/v3/api-docs`). Générer avec **openapi-typescript** vers `src/api/generated/schema.d.ts` (script `pnpm gen:api`) ; alias de domaine exposés dans `src/api/types.ts`.
- Le client **openapi-fetch** vit dans `src/api/http.ts`, avec `baseUrl = VITE_API_BASE_URL` — **vide par défaut**, donc appels relatifs same-origin relayés par le proxy de dev Vite.
- **Toute réponse passe par `unwrap()`** : renvoie `data` ou lève une `ApiError`. Ne jamais lire `result.data` directement, un statut d'erreur passerait inaperçu.
- Les listes Spring exposent un objet `pageable` : le `querySerializer` de `http.ts` l'aplatit en `page/size/sort`.
- **Ne jamais réécrire à la main** les types d'entités : les importer depuis le schéma généré. Si un endpoint manque, le signaler — ne pas le créer côté front.

## Authentification & intercepteur
- **Access ET refresh en mémoire** (`src/api/tokenStore.ts`, jamais `localStorage`). En-tête `Authorization: Bearer <token>` ajouté par le `fetch` maison de `http.ts`.
- Sur **401** : tenter un **refresh** (en un seul vol), rejouer la requête une fois ; si le refresh échoue → purge + redirection Connexion.
- ⚠️ **Exception : les endpoints `/admin/auth/*` sont exclus de ce mécanisme.** Leurs 401 sont métier (`invalid-credentials`, `invalid-code`, token de reset invalide) et non des sessions expirées — voir le skill **auth-flow**.
- Ne jamais logger les tokens.

## Hooks React Query par ressource
- Un module par domaine dans `src/api/` (ex. `prayers.ts`, `users.ts`, `payments.ts`, `notifications.ts`, `settings.ts`).
- Exposer des hooks : `usePrayers(filters)`, `usePrayer(id)`, `useCreatePrayer()`, `usePublishPrayer()`, etc. — construits sur `useQuery`/`useMutation`.
- **Clés de cache** structurées (`['prayers', filters]`) ; **invalider** après mutation (ex. publier → invalider la liste et le détail).
- Gérer la **pagination** serveur (`page`, `size`, `sort`) et exposer `content/totalElements/...`.

## Erreurs
- Mapper les réponses **RFC 7807** (`application/problem+json`) en messages FR sobres pour l'UI (toasts / erreurs de champ), jamais le brut technique.
- Indexer sur `ProblemDetail.code` via `src/i18n/errors.ts` (`errorMessage`, ou `errorMessageFor` pour une nuance propre à une action). **Ne jamais afficher `detail`.** Repli générique si le code est inconnu.

## Définition de terminé
- [ ] Types générés depuis l'OpenAPI (script reproductible) ; aucun type d'API écrit à la main.
- [ ] Client typé avec baseUrl par variable d'environnement.
- [ ] Intercepteur : Bearer en mémoire + refresh sur 401 + retry ; déconnexion propre si échec.
- [ ] Hooks React Query par ressource avec invalidation cohérente.
- [ ] Erreurs RFC 7807 traduites en messages FR ; aucun token loggé.
