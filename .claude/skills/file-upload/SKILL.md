---
name: file-upload
description: Implémente le téléversement du fichier audio et le suivi d'encodage dans le back-office React/TS Mohamed Chérif — dropzone (drag & drop), envoi multipart avec barre de progression, puis suivi des étapes d'encodage/chiffrement (Téléversé → Transcodage → Chiffrement → Prêt) par polling de l'API. À utiliser pour l'écran de publication d'un prêche.
---

# Skill : file-upload

Gère l'upload de l'audio brut et l'affichage de la progression jusqu'à ce que le prêche soit prêt à publier. Le chiffrement se fait **côté serveur** (Voie B — HLS AES-128) ; le front ne fait qu'envoyer et suivre.

## Dropzone & envoi
- **Zone de dépôt** (drag & drop + bouton parcourir) : formats MP3/WAV/M4A, taille max **500 Mo**. Valider type et taille avant envoi ; message FR clair si refus.
- Envoi **multipart** vers `POST /admin/prayers/{id}/audio` avec **barre de progression d'upload** (événement de progression de la requête).
- Style conforme au design system (dropzone `surface` + bordure `border` en pointillé, radius 16 ; état survol `primary`).

## Suivi d'encodage
- À la fin de l'upload, l'API renvoie un `jobId`/état. **Poller** `GET /admin/prayers/{id}/encoding` (via React Query `refetchInterval`) pour afficher les **étapes** : Téléversé ✓ → Transcodage → Chiffrement → Prêt, avec le pourcentage.
- Arrêter le polling quand l'état est `READY` (activer « Publier ») ou `FAILED` (message d'erreur + possibilité de réessayer).
- Ne jamais afficher de spinner plein écran : la progression multi-étapes tient lieu d'indicateur.

## Intégration à l'écran Publication
- L'écran combine ce composant avec le **formulaire** (skill **forms**) : métadonnées + accès Gratuit/Premium + « Notifier à la publication ». Le bouton **Publier** n'est actif que lorsque l'encodage est `READY`.
- À la publication (`POST /admin/prayers/{id}/publish`), invalider la liste des prêches et le détail.

## Robustesse
- Gérer la reprise/annulation d'upload proprement ; gérer les erreurs réseau ; ne pas bloquer l'UI pendant l'encodage (asynchrone côté serveur).

## Définition de terminé
- [ ] Dropzone avec validation type/taille et barre de progression d'upload.
- [ ] Suivi d'encodage par polling avec étapes + pourcentage ; arrêt sur READY/FAILED.
- [ ] Bouton Publier actif seulement si READY ; publication invalide les caches.
- [ ] Erreurs FR sobres ; pas de spinner plein écran ; style conforme au design.
