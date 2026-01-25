# instruction.md — Telegram Mini App (Next.js + shadcn/ui) + Admin + Supabase VPS + Better Auth

## Objectif du projet

Créer une **mini app Telegram** premium avec 4 sections principales :

1. Catalogue produit  
2. Panier  
3. Avis  
4. Informations  

Créer un **admin side simple** pour gérer l’intégralité du contenu.

Contraintes clés :
- Mini app **accessible uniquement via Telegram** (côté user)
- Admin **accessible de partout** (web normal) + login
- Mobile-first, responsive, simple d’utilisation
- Backend (Supabase) **déjà sur VPS** : créer une **nouvelle DB** sans impacter les autres
- Repo GitHub à créer : **keiy78120/mini-app**
- Déploiement frontend sur **Vercel via Vercel CLI**
- Projet doit être **prêt local + prod** (environnement de dev + prod Vercel, sans bricolage)

---

## Versions à utiliser (dernières stables)

⚠️ L’agent doit initialiser le projet avec ces versions (ou `@latest`) et verrouiller via lockfile.

- Next.js : **16.1.4** :contentReference[oaicite:0]{index=0}  
- React : **19.2.3** :contentReference[oaicite:1]{index=1}  
- Tailwind CSS : **4.1.18** :contentReference[oaicite:2]{index=2}  
- TypeScript : **5.9.3** :contentReference[oaicite:3]{index=3}  
- Zustand : **5.0.10** :contentReference[oaicite:4]{index=4}  
- Motion (Framer Motion) : **12.29.0** :contentReference[oaicite:5]{index=5}  
- Supabase JS : **2.91.1** :contentReference[oaicite:6]{index=6}  
- Better Auth : **1.4.17** :contentReference[oaicite:7]{index=7}  

Notes runtime :
- Utiliser **Node 20+** (recommandé) pour compatibilité tooling moderne (et Supabase CLI si utilisée). :contentReference[oaicite:8]{index=8}  

---

## Stack technique (choix final)

### Frontend
- Next.js (App Router)
- TypeScript
- shadcn/ui
- TailwindCSS v4
- Zustand (panier + persistance localStorage)
- Motion (Framer Motion) optionnel : animations très légères

### Backend / Data
- Supabase (Postgres + Storage)
- Supabase est **déjà installé sur un VPS existant**
- ⚠️ Créer une **NOUVELLE database dédiée** au projet
  - Ne pas écraser
  - Ne pas modifier
  - Ne pas interférer avec les autres DB existantes

### Auth Admin (obligatoire)
- **Better Auth** (login admin le plus simple)
- Session sécurisée, cookies httpOnly
- Stockage user/roles en DB (Supabase Postgres)

### Déploiement
- Front : Vercel + Vercel CLI
- Backend : Supabase VPS existant (DB + Storage + Auth tables Better Auth)

---

## GitHub / Repo (obligatoire)

1. Créer le repo GitHub : **keiy78120/mini-app**
2. Initialiser Next.js dans ce repo
3. Mettre en place :
   - `.env.example` complet
   - `README.md` minimal
   - `LICENSE` (MIT par défaut si ok)
   - `pnpm-lock.yaml` (ou npm/yarn, mais choisir 1 seul)
4. Activer une CI basique (lint + typecheck) via GitHub Actions

⚠️ Si l’agent n’a pas accès GitHub, il doit demander :
- un **PAT GitHub** (droits repo)  
OU  
- que l’utilisateur crée le repo + ajoute l’agent en collaborator

---

## Contrainte Supabase (CRITIQUE)

- Supabase existe déjà sur un VPS
- Le projet doit :
  - créer une nouvelle **database** (ou nouveau projet Supabase si votre VPS est multi-projets)
  - utiliser uniquement ses tables
  - isoler credentials
- AUCUN impact sur les autres DB / tables

⚠️ L’agent doit demander les accès VPS/Supabase avant d’agir.

---

## Access policy : Mini App Telegram vs Admin Web

### Côté User (mini app)
- La mini app **doit être inutilisable hors Telegram**
- Si ouverte dans un navigateur classique :
  - afficher une page “Open in Telegram”
  - ne pas afficher le catalogue
  - ne pas exposer de data user UI

Implémentation :
- Gate UI : vérifier `window.Telegram?.WebApp` côté client
- Gate API : exiger `initData` Telegram vérifié côté serveur pour tout endpoint user

### Côté Admin
- Admin **accessible de partout** (navigateur normal)
- Auth via **Better Auth**
- Protection route `/admin` via middleware serveur + session Better Auth
- Rôle admin obligatoire (RBAC minimal)

---

## Direction UI / UX (OBLIGATOIRE)

### Style général
- Apple-like
- VisionOS / iOS inspired
- Dark mode par défaut
- Glassmorphism premium
- Sensation d’application native

### Principes visuels
- Fonds sombres
- Surfaces semi-transparents
- `backdrop-blur`
- Légers gradients
- Cartes flottantes
- Ombres très subtiles
- Rayons généreux
- Espacements aérés

### Navigation
- Bottom navigation fixe (4 items)
- Effet “frosted glass”
- Icônes simples et monochromes
- Feedback tactile doux

### Animations
- Douces et discrètes uniquement
- Fade / slide léger
- Aucun effet agressif

### Mobile-first
- Conçu **mobile-first**
- Responsive complet
- Tap targets larges
- Performances : images optimisées

### Interdictions
- Pas de couleurs criardes
- Pas d’effets néon
- Pas de Material Design
- Pas d’UI surchargée

Objectif :
> Donner l’impression d’une mini app Apple native intégrée à Telegram, premium, calme, simple.

---

## Fonctionnalités (User)

### 1. Catalogue
- Liste produits (cards)
- Image principale
- Nom, prix
- Tags / labels (farm, origine, badge)
- Filtre catégories
- Ajout au panier
- Détail produit via modal / sheet

### 2. Panier
- Liste produits ajoutés
- Quantité + suppression
- Total dynamique
- Bouton “Commander”
- Empty state illustrée

Version 1 (simple et rapide) :
- Panier 100% local (Zustand + localStorage)
- “Commander” = génération d’un récap (message Telegram / ou création “order” en DB)

### 3. Avis
- Liste avis
- “Laisser un avis”
- Rating + texte
- Avis produit ou global
- Option modération via admin

### 4. Informations
- Modes d’envoi
- Modes de paiement
- Règles (minimum, délais, discrétion)
- Contenu dynamique (éditable via admin)

---

## Admin (Better Auth)

### Pages admin minimales
- `/admin/login` (Better Auth)
- `/admin` (dashboard)
- `/admin/products` (CRUD produits + upload images)
- `/admin/settings` (édition “Informations”)
- `/admin/reviews` (modération optionnelle)

### RBAC minimal
- `role = admin` requis
- Les endpoints write (create/update/delete) doivent être protégés par session Better Auth + role

---

## Modèle de données (Postgres)

### products
- id (uuid)
- name
- slug
- description
- price (int, cents)
- currency
- images
- category
- tags
- farm_label
- origin_flag
- is_active
- created_at

### reviews
- id
- product_id (nullable)
- telegram_user_id
- username
- rating
- content
- status (pending / published)
- created_at

### settings
- key
- value (json / text)
- updated_at

### orders (optionnel)
- id
- telegram_user_id
- items (json)
- total
- status
- created_at

### Auth (Better Auth)
- Installer le schéma requis Better Auth (via CLI migrate ou SQL manuel)
- Ajouter table `profiles` / `roles` si nécessaire (selon implémentation)

---

## Structure du projet
app/
├─ (webapp)/
│ ├─ layout.tsx
│ ├─ page.tsx
│ ├─ cart/page.tsx
│ ├─ reviews/page.tsx
│ ├─ info/page.tsx
│
├─ admin/
│ ├─ layout.tsx
│ ├─ login/page.tsx
│ ├─ page.tsx
│ ├─ products/
│ ├─ settings/
│ ├─ reviews/
│
├─ api/
│ ├─ telegram/verify/route.ts
│ ├─ products/route.ts
│ ├─ reviews/route.ts
│
lib/
├─ telegram/verifyInitData.ts
├─ auth/better-auth.ts
├─ auth/guard.ts
├─ supabase/client.ts
├─ store/cart.ts


---

## Environnements : local + prod (obligatoire)

### Local
- `.env.local` (non commit)
- `pnpm dev` fonctionne immédiatement
- Connexion à la DB Supabase VPS (par défaut) OU possibilité d’un mode local (optionnel)
- Seed minimal (quelques produits) pour tester vite

### Prod (Vercel)
- Variables d’environnement configurées via `vercel env add`
- `vercel deploy --prod` doit fonctionner sans intervention supplémentaire

Fichiers requis :
- `.env.example` (complet, documenté)
- `vercel.json` si besoin (sinon éviter)

---

## Bonnes pratiques de dev (obligatoire)

- TypeScript strict
- ESLint + (option) Prettier
- Validation env (Zod) au boot (ex: `env.ts`) pour éviter crash silencieux
- Séparation claire :
  - composants UI (components/)
  - logique métier (lib/)
  - accès data (lib/supabase)
- Pas de secrets côté client (BOT_TOKEN, etc. uniquement serveur)
- Logs raisonnables + gestion erreurs (toasts propres)
- Images : Next Image + compression
- PR-friendly : scripts `lint`, `typecheck`, `test` (même si test minimal)

Scripts requis :
- `dev`
- `build`
- `start`
- `lint`
- `typecheck`

---

## Setup (ordre strict)

1. Créer repo GitHub `keiy78120/mini-app`
2. Init Next.js (App Router, TS, Tailwind v4)
3. Installer shadcn/ui
4. Installer Better Auth + schéma DB
5. Connecter Supabase VPS (nouvelle DB) + créer tables
6. Implémenter :
   - gate Telegram-only user
   - auth admin Better Auth accessible partout
7. Construire l’UI user (4 onglets)
8. Construire admin (CRUD + settings)
9. Tests mobile Telegram (iOS/Android)
10. Déploiement Vercel (preview + prod)

---

## Déploiement Vercel (CLI)

```bash
vercel login
vercel link
vercel env add
vercel deploy --prod

Checklist finale
----------------

*   Repo GitHub keiy78120/mini-app créé + push OK
*   Supabase VPS : nouvelle DB créée sans impacter l’existant
*   User UI : inaccessible hors Telegram
*   Admin UI : accessible partout + sécurisé (Better Auth)
*   Mobile-first : responsive + tap targets OK
*   Panier persistant
*   CRUD produits OK
*   Informations éditables via admin
*   Avis OK (modération optionnelle)
*   Déploiement Vercel prod OK
    

Informations / accès requis à demander à l’utilisateur (OBLIGATOIRE)
--------------------------------------------------------------------

L’agent doit demander immédiatement tout ce qui est nécessaire pour exécuter vite, sans aller-retour :

### GitHub

*   Confirmer repo : keiy78120/mini-app
*   Accès pour créer/push :
    *   PAT GitHub (repo)      
    *   OU repo créé manuellement + ajout collaborator
        

### VPS / Supabase
*   URL Supabase 
*   Méthode d’accès (SSH / panel / credentials) 
*   Droits de création nouvelle DB / user DB 
*   Accès Storage bucket (ou autorisation de création) 
*   Credentials DB (host/port/db/user/password) ou méthode officielle Supabase

### Telegram
*   BOT\_TOKEN
*   Bot username
*   Config BotFather Mini App (URL Vercel prod)
*   (Optionnel) policy sur avis (modération oui/non)
    

### Better Auth

*   Choix provider : email/password (par défaut) ou magic link
*   Email admin initial
*   Mot de passe initial (si email/password)
    

### Vercel

*   Accès Vercel (team/perso)
*   Variables d’environnement
*   Domaine custom (oui/non)
    

Objectif :
> L’agent doit obtenir ces infos au début, pour livrer le projet au plus vite.
