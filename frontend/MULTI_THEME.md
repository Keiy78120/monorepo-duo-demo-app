# Instructions - Système Multi-Thèmes pour Mini App Telegram (Tailwind CSS)

## Objectif

Implémenter un système de sélection de thèmes multiples (pas seulement dark/light) pour la navbar et l'ensemble de la Mini App Telegram. Les utilisateurs pourront choisir entre plusieurs styles/templates visuels distincts (ex: Classic, Neon, Nature, Ocean, Cannabis, Luxury, etc.).

---

## Stack technique

- **Framework CSS**: Tailwind CSS (v4 ou v3)
- **Approche**: CSS Variables (custom properties) + data-attributes
- **Storage**: localStorage pour persister le choix utilisateur
- **Integration**: Compatible avec Telegram Mini Apps API

---

## Ressources de documentation à consulter

### 1. Tailwind CSS - Multiple Themes

**Documentation officielle Tailwind theming:**
- https://tailwindcss.com/docs/theme
- https://tailwindcss.com/docs/customizing-colors

**Implémentation multi-thèmes avec Tailwind:**
- https://stackoverflow.com/questions/69150928/how-to-create-multiple-themes-using-tailwind-css
- https://dev.to/ultroneoustech/creating-multiple-themes-in-tailwind-css-and-nextjs-2e98
- https://stackoverflow.com/questions/73288279/how-to-set-multiple-themes-in-tailwind-css

**Tailwind v4 custom variants pour thèmes:**
- https://dev.to/vrauuss_softwares/-create-custom-themes-in-tailwind-css-v4-custom-variant-12-2nf0
- https://github.com/tailwindlabs/tailwindcss/discussions/16292
- https://github.com/tailwindlabs/tailwindcss/discussions/15600

---

### 2. Glassmorphism / Frosted Glass Effect

**Implémentation backdrop-filter:**
- https://www.joshwcomeau.com/css/backdrop-filter/
- https://blog.openreplay.com/creating-blurred-backgrounds-css-backdrop-filter/
- https://blog.openreplay.com/create-glassmorphic-ui-effects-css/

**Générateur interactif:**
- https://css.glass (pour tester et générer le CSS)

---

### 3. Telegram Mini Apps Theming

**Documentation officielle Telegram:**
- https://core.telegram.org/bots/webapps (section Theme Parameters)
- https://docs.telegram-mini-apps.com/platform/theming

**Tutoriels spécifiques:**
- https://www.youtube.com/watch?v=HoF01q05fn0 (Make TON Telegram Mini App - Customize Theme)

---

### 4. Theme Switching Logic

**JavaScript theme switcher patterns:**
- https://fossheim.io/writing/posts/accessible-theme-picker-html-css-js/
- https://www.studytonight.com/post/build-a-theme-switcher-for-your-website-with-javascript
- https://codetv.dev/blog/css-color-theme-switcher-no-flash

**Librairies recommandées:**
- **theme-change** (DaisyUI): https://github.com/saadeghi/theme-change
- **tw-colors** (Tailwind plugin): https://github.com/L-Blondy/tw-colors (référencé dans les discussions Stack Overflow)

---

## Architecture à implémenter

### 1. Structure des thèmes

Créer plusieurs thèmes distincts avec:
- Couleurs de navbar (background, border, shadow)
- Couleurs de texte (normal, active, hover)
- Couleurs globales de l'app (primary, secondary, accent)
- Effet glassmorphism paramétrable (blur amount, transparency)

**Exemples de thèmes à créer:**
- `default` (Classic Dark)
- `neon` (Neon Purple/Pink)
- `nature` (Green/Earth tones)
- `ocean` (Blue/Cyan)
- `cannabis` (Green cannabis theme)
- `luxury` (Gold/Black)

### 2. Système de data-attributes

Utiliser `data-theme` sur l'élément `<html>` pour switcher:
```
<html data-theme="neon">
```

### 3. CSS Variables dans Tailwind

Définir les variables CSS custom dans `tailwind.config.js` ou directement en CSS, puis les utiliser via les classes Tailwind.

**Consulter particulièrement:**
- La discussion Stack Overflow sur comment créer des thèmes avec `rgb(var(--color-name) / <alpha-value>)`
- Les exemples Tailwind v4 avec `@theme` et custom variants

### 4. Persistence

Sauvegarder le thème sélectionné dans `localStorage` avec clé `app-theme` ou `user-theme-preference`.

### 5. UI du Theme Picker

Créer une interface utilisateur pour sélectionner le thème:
- Option 1: Palette de couleurs circulaires (comme dans les screenshots fournis)
- Option 2: Cards avec preview du thème
- Option 3: Dropdown/select simple

### 6. Integration Telegram

Respecter le `colorScheme` de Telegram (`tg.colorScheme`) comme fallback si l'utilisateur n'a pas encore choisi de thème personnalisé.

Utiliser `HapticFeedback` lors du changement de thème pour feedback tactile.

---

## Composants à implémenter

### Bottom Navigation avec Glassmorphism

La navbar doit:
- Être fixed en bas avec position `fixed bottom-0`
- Avoir l'effet frosted glass (backdrop-filter)
- S'adapter automatiquement au thème sélectionné
- Gérer le safe-area iOS (`env(safe-area-inset-bottom)`)
- Contenir 4 items: Menu, Panier, Avis, Infos
- Afficher visuellement l'item actif

### Theme Switcher UI

Interface pour changer de thème:
- Accessible depuis un onglet Settings/Infos
- Visuelle et intuitive
- Feedback immédiat du changement
- Persistence automatique

---

## Points techniques importants

### Safe Area iOS

Consulter:
- https://github.com/TelegramMessenger/Telegram-iOS/issues/1377
- La documentation sur `env(safe-area-inset-bottom)`

### Performance backdrop-filter

Le `backdrop-filter` peut être coûteux. Utiliser:
- `will-change: backdrop-filter`
- `transform: translateZ(0)` pour forcer GPU
- Limiter la zone de blur si possible

### No Flash of Unstyled Content (FOUC)

Appliquer le thème **avant** le premier render:
- Script inline dans `<head>` pour lire localStorage
- Setter `data-theme` immédiatement
- Consulter: https://codetv.dev/blog/css-color-theme-switcher-no-flash

---

## Librairies à considérer

### Option 1: theme-change (Recommandé - simple)
- Repo: https://github.com/saadeghi/theme-change
- Gère automatiquement localStorage et data-attributes
- Léger et sans dépendances

### Option 2: tw-colors (Plugin Tailwind)
- Permet de définir des thèmes directement dans `tailwind.config.js`
- Référencé dans Stack Overflow comme solution propre

### Option 3: Vanilla JS custom
- Pas de dépendance externe
- Total contrôle
- Consulter les patterns dans les articles fossheim.io et studytonight

---

## Checklist d'implémentation

- [ ] Configurer Tailwind avec CSS Variables pour thèmes multiples
- [ ] Créer au moins 4 thèmes visuellement distincts
- [ ] Implémenter data-attribute switching (`data-theme`)
- [ ] Créer la bottom navbar avec glassmorphism effect
- [ ] Implémenter le theme picker UI
- [ ] Ajouter localStorage persistence
- [ ] Gérer safe-area pour iOS
- [ ] Intégrer avec Telegram WebApp API (themeParams, HapticFeedback)
- [ ] Tester sur mobile Telegram
- [ ] Optimiser performance backdrop-filter
- [ ] Éviter FOUC au chargement

---

## Priorités

1. **Haute**: Implémenter système de base avec 3-4 thèmes fonctionnels
2. **Haute**: Navbar glassmorphism qui s'adapte aux thèmes
3. **Moyenne**: Theme picker UI intuitif
4. **Moyenne**: Persistence localStorage
5. **Basse**: Animations de transition entre thèmes
6. **Basse**: Preview en temps réel dans le picker

---

**Note**: Consulter particulièrement les ressources Tailwind v4 si tu utilises la dernière version, sinon focus sur les approches v3 avec `tailwind.config.js`.
