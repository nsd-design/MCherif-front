---
name: design-system
description: Applique le design system Mohamed Chérif au back-office web React/TS (tokens couleurs clair/sombre, typographie Manrope, rayons, espacements, composants desktop : sidebar, tableaux, cartes de stats, badges de statut). À utiliser dès qu'on style ou implémente une page, un composant ou qu'on ajuste une couleur/espacement. Garantit qu'aucune valeur de style n'est en dur et qu'aucune nouvelle couleur n'est introduite.
---

# Skill : design-system (web desktop)

Mêmes tokens que l'app mobile, adaptés au desktop. Source : `DESIGN-SYSTEM.md`.

## Règles d'or
1. **Aucune valeur de style en dur.** Couleur, espacement, rayon, taille, ombre → toujours via les tokens (`theme/`).
2. **Un seul accent : le vert.** Jamais deux accents sur un écran.
3. **Ne jamais introduire de nouvelle couleur.** Besoin sans token → s'arrêter et demander.
4. **Taille de police minimum 11 px.** Grille d'espacement de 4. Padding de la zone de contenu : 32.

## Mise en place du thème
- `theme/tokens.css` : deux jeux de **variables CSS** (`:root` clair, `[data-theme="dark"]` sombre). `ThemeProvider` bascule `data-theme` sur `<html>`.
- Clair : `--bg #F6F5F2`, `--surface #FFFFFF`, `--border #E7E5E0`, `--divider #ECEAE4`, `--text #17201B`, `--text-muted #6B7570`, `--text-faint #9AA39D`, `--primary #0E7A45`, `--primary-deep #0B5C36`, `--primary-soft #E4F1E9`, `--danger #B23A3A`.
- Sombre : `--bg #121714`, `--surface #1B221D`, `--border/#divider #2A332D`, `--text #F2F4F1`, `--text-muted #9AA79F`, `--primary #35A46C`, `--primary-soft rgba(53,164,108,0.14)`.
- Statuts : `--st-success`=primary, `--st-warn` ambre (`#A96B1F` clair / `#D69A45` sombre), `--st-muted`=textMuted, `--st-danger`=danger. Rendus en **badges pilules teintés** (fond clair de la teinte + texte foncé).
- Rayons : `--r-field 14`, `--r-card 16`, `--r-panel 18`, `--r-thumb 12`, `--r-pill 999`.
- Manrope 400/600/700/800 ; consommer via variables de graisse.

## Composants desktop (styliser via tokens)
- **Sidebar** : item actif = fond `primary-soft` + texte `primary` + barre verte à gauche ; inactif = `text-muted`.
- **TopBar** : recherche globale + avatar admin (initiales sur `primary`).
- **DataTable** : en-tête 700 **MAJUSCULES 11 px** letter-spacing 0.04em ; lignes séparées par `divider` ; survol `primary-soft` léger ; hauteur de ligne ≥ 48.
- **StatCard** : `surface` + `border`, chiffre 24–28/800, label 12 `text-muted`, variation.
- **StatusBadge** : pilule teintée selon le statut.
- **Champs** : `surface` + bordure `border`, focus **1.5 px `primary`**, placeholder `text-faint`.
- **Boutons** : primaire = fond `primary`, texte blanc 15/800, ombre verte ; secondaire = bordure `border`, fond `surface`. **Un seul bouton primaire proéminent par écran.**
- **Modale / Drawer** : `surface`, radius 18, ombre douce neutre.
- **Aucune ombre** sur cartes/tables ordinaires.

## Contenu
- Montants `10 000 GNF` / `100 000 GNF` (espace insécable) via `lib/formatGnf`. Dates `12 juin 2026` via `lib/formatDate`. Micro-labels en MAJUSCULES (letter-spacing 0.04em) uniquement.

## Définition de terminé
- [ ] Aucun hex ni nombre magique de style hors `theme/`.
- [ ] Fonctionne en clair ET en sombre.
- [ ] Un seul accent vert ; badges de statut cohérents.
- [ ] Textes ≥ 11 px ; densité de table lisible (≥ 48).
- [ ] Montants GNF et dates formatés via `lib/`.
