# Contexte du Projet - Demo App

> Fichier de référence rapide pour les agents IA. Mis à jour le 2026-01-24.

## Vue d'ensemble

**Nom**: Demo App
**Type**: Telegram Mini App - E-commerce Cannabis Premium
**Design**: UI Glassmorphisme inspiré Apple VisionOS
**Status**: Production

## Stack Technique

| Catégorie | Technologies |
|-----------|--------------|
| **Frontend** | Next.js 16, React 19, TypeScript 5.9, Tailwind CSS 4 |
| **Animations** | Motion (Framer Motion) 12.x |
| **UI Components** | shadcn/ui + Radix UI |
| **State** | Zustand 5 |
| **Backend** | Next.js API Routes, PostgreSQL |
| **BDD** | Supabase (PostgreSQL hébergé) |
| **Auth** | Better Auth + Whitelist Telegram ID |
| **Intégrations** | Telegram WebApp API, Cannabis API, Groq LLM |
| **Deploy** | Vercel |

## Architecture des Dossiers

```
app/
├── (webapp)/          # Pages utilisateur (Mini App Telegram)
│   ├── page.tsx       # Catalogue produits
│   ├── cart/          # Panier
│   ├── checkout/      # Commande
│   ├── reviews/       # Avis
│   ├── info/          # Infos boutique
│   └── profile/       # Profil utilisateur
├── admin/             # Panel admin (accessible web)
│   ├── page.tsx       # Dashboard analytics
│   ├── products/      # Gestion produits
│   ├── orders/        # Gestion commandes
│   ├── reviews/       # Modération avis
│   └── settings/      # Paramètres
└── api/               # Endpoints REST
    ├── products/      # CRUD produits
    ├── orders/        # CRUD commandes
    ├── reviews/       # CRUD avis
    ├── categories/    # CRUD catégories
    ├── drivers/       # Gestion livreurs
    └── admin/         # Endpoints admin (AI, emergency)

components/
├── ui/                # shadcn/ui (Button, Card, Dialog...)
├── ProductCard.tsx    # Carte produit
├── CartItem.tsx       # Item panier
├── BottomNav.tsx      # Navigation mobile
├── TelegramGate.tsx   # Auth Telegram
└── admin/             # Composants admin

lib/
├── auth/              # Better Auth + guards
├── store/             # Zustand stores (cart, telegram)
├── db/                # Types DB partagés
├── telegram/          # Vérification initData
└── integrations/      # Cannabis API, Groq
```

## Base de Données

### Tables Principales

| Table | Description |
|-------|-------------|
| `products` | Produits cannabis (prix, images, variété, stock) |
| `pricing_tiers` | Paliers de prix par quantité (5g, 10g, 25g) |
| `product_categories` | Catégories de produits |
| `orders` | Commandes (items JSONB, status, livreur) |
| `reviews` | Avis clients (modération pending/published/rejected) |
| `drivers` | Livreurs |
| `settings` | Configuration boutique (JSONB) |
| `user/session` | Tables Better Auth |

### Fonctions DB Importantes

- `calculate_selling_price()` - Calcul prix de vente depuis coût
- `get_next_daily_order_number()` - Numérotation journalière commandes
- `update_updated_at_column()` - Trigger mise à jour timestamp

## Fonctionnalités Clés

### Utilisateur (Mini App)
- [x] Catalogue produits avec filtres catégories
- [x] Panier persistant (localStorage)
- [x] Paliers de prix dynamiques (quantités variables)
- [x] Système d'avis
- [x] Checkout commande

### Admin
- [x] Dashboard analytics (revenus, commandes, top produits)
- [x] CRUD produits avec upload images
- [x] Gestion commandes + assignation livreurs
- [x] Modération avis
- [x] Génération descriptions IA (Groq)
- [x] Mode maintenance
- [x] Emergency nuke (suppression repos)

## API Endpoints

### Public
```
GET  /api/products          # Liste produits
GET  /api/products/[id]     # Détail produit
GET  /api/categories        # Liste catégories
POST /api/orders            # Créer commande
GET  /api/reviews           # Liste avis
POST /api/reviews           # Soumettre avis
```

### Admin (protégé)
```
POST /api/products          # Créer produit
PUT  /api/products/[id]     # Modifier produit
DELETE /api/products/[id]   # Supprimer produit
GET  /api/orders            # Toutes commandes
PUT  /api/orders/[id]       # Modifier commande
POST /api/admin/ai/description  # Génération IA
POST /api/admin/check       # Vérif accès admin
```

## State Management

### useCartStore (Zustand)
```typescript
// Clé localStorage: "demo-app-cart"
addItem(product, tier)
removeItem(itemId)
updateQuantity(itemId, quantity)
clearCart()
getTotal() → number
getItemCount() → number
```

### useTelegramStore
```typescript
userId: string
username: string
firstName: string
initData: string
webApp: TelegramWebApp
```

## Sécurité

1. **Whitelist Telegram ID** - `ADMIN_TELEGRAM_IDS` en env
2. **Better Auth Sessions** - Vérification côté serveur
3. **API Guards** - `adminGuard()` sur endpoints admin
4. **Init Data Verification** - HMAC-SHA256 Telegram

## Variables d'Environnement

```env
DATABASE_URL                    # PostgreSQL
TELEGRAM_BOT_TOKEN             # Bot Telegram
BETTER_AUTH_SECRET             # Secret sessions
NEXT_PUBLIC_SUPABASE_URL       # Supabase endpoint
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Clé publique Supabase
SUPABASE_SERVICE_ROLE_KEY      # Clé admin Supabase
ADMIN_TELEGRAM_IDS             # IDs admin séparés par virgule
GROQ_API_KEY                   # API Groq pour IA
```

## Commandes Utiles

```bash
npm run dev          # Dev avec Turbopack
npm run build        # Build production
npm run db:generate  # Générer types Supabase
npm run db:push      # Push migrations
npm run typecheck    # Vérif TypeScript
```

## Design System

### Couleurs (Ice Glass Theme)
- **Background**: Ice white avec teinte bleue
- **Primary**: Glacier blue vibrant
- **Success**: Mint green
- **Warning**: Amber
- **Destructive**: Red

### CSS Classes Glassmorphisme
```css
.glass          /* Effet verre basique */
.glass-card     /* Carte avec ombre */
.glass-nav      /* Barre navigation */
.glass-button   /* Bouton */
.glass-input    /* Input */
```

## Historique des Mises à Jour Récentes

| Date | Commit | Description |
|------|--------|-------------|
| Récent | eba7f62 | Ajout variants boutons success/warning |
| Récent | b65148d | Fix 401 admin Telegram + settings maintenance |
| Récent | 7b3f312 | Contrôle message maintenance |
| Récent | 9ca2f3a | Refonte UI emergency → nuke |
| Récent | f67a728 | Amélioration cartes produits + seed assets |

## Fichiers Modifiés (non commités)

```
app/(webapp)/cart/page.tsx
app/(webapp)/checkout/page.tsx
app/(webapp)/page.tsx
app/(webapp)/reviews/page.tsx
app/admin/layout.tsx
app/admin/orders/page.tsx
app/admin/page.tsx
app/admin/products/page.tsx
app/globals.css
components/BottomNav.tsx
components/CartItem.tsx
components/CategoryFilter.tsx
components/ProductCard.tsx
components/ui/button.tsx
components/ui/card.tsx
```

---

## Notes pour les Agents

- **Toujours lire** les fichiers avant modification
- **Respecter** le design glassmorphisme existant
- **Ne pas modifier** les guards d'auth sans comprendre le système
- **Tester** les endpoints avec les bons headers Telegram
- **Prix en centimes** dans la DB (integer, pas float)
- **Images** stockées sur Supabase Storage
