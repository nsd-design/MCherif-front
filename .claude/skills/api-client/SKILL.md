---
name: api-client
description: Met en place et utilise le client API typé du back-office React/TS Mohamed Chérif — génération des types depuis la spec OpenAPI du backend Spring Boot, wrapper fetch typé, intercepteur JWT (access en mémoire) avec refresh automatique, et hooks TanStack Query par ressource. À utiliser pour tout appel à l'API admin ou ajout d'une nouvelle requête serveur.
---

# Skill : api-client

Le front ne parle à l'API **que** via un client typé généré depuis l'OpenAPI. On n'invente jamais d'URL ni de type.

## Génération des types
- Source : la spec OpenAPI du backend (`/v3/api-docs`). Générer avec **openapi-typescript** vers `src/api/schema.d.ts` (script `pnpm run gen:api`).
- Utiliser **openapi-fetch** (client typé léger) créé dans `src/api/client.ts` avec `baseUrl = import.meta.env.VITE_API_BASE_URL`.
- **Ne jamais réécrire à la main** les types d'entités : les importer depuis le schéma généré. Si un endpoint manque, le signaler — ne pas le créer côté front.

## Authentification & intercepteur
- **Access token en mémoire** (jamais `localStorage`). Ajouter l'en-tête `Authorization: Bearer <token>` via un middleware du client.
- Sur **401** : tenter un **refresh** (endpoint dédié), rejouer la requête une fois ; si le refresh échoue → déconnexion + redirection Connexion.
- Ne jamais logger les tokens.

## Hooks React Query par ressource
- Un module par domaine dans `src/api/` (ex. `prayers.ts`, `users.ts`, `payments.ts`, `notifications.ts`, `settings.ts`).
- Exposer des hooks : `usePrayers(filters)`, `usePrayer(id)`, `useCreatePrayer()`, `usePublishPrayer()`, etc. — construits sur `useQuery`/`useMutation`.
- **Clés de cache** structurées (`['prayers', filters]`) ; **invalider** après mutation (ex. publier → invalider la liste et le détail).
- Gérer la **pagination** serveur (`page`, `size`, `sort`) et exposer `content/totalElements/...`.

## Erreurs
- Mapper les réponses **RFC 7807** (`application/problem+json`) en messages FR sobres pour l'UI (toasts / erreurs de champ), jamais le brut technique.

## Définition de terminé
- [ ] Types générés depuis l'OpenAPI (script reproductible) ; aucun type d'API écrit à la main.
- [ ] Client typé avec baseUrl par variable d'environnement.
- [ ] Intercepteur : Bearer en mémoire + refresh sur 401 + retry ; déconnexion propre si échec.
- [ ] Hooks React Query par ressource avec invalidation cohérente.
- [ ] Erreurs RFC 7807 traduites en messages FR ; aucun token loggé.
