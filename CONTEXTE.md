# Contexte du Projet - Telegram Mini App Demo

> Documentation pour cloner, configurer et personnaliser rapidement l'application pour vos clients.

## Vue d'ensemble

**Type**: Telegram Mini App - E-commerce Cannabis
**Architecture**: Monorepo avec frontend Next.js + backend Cloudflare
**Déploiement**: Frontend sur Vercel, Backend (API) sur Cloudflare Pages/Workers
**Bot Telegram**: [@yx_bot_app](https://t.me/yx_bot_app)

## Stack Technique

### Frontend (Next.js)
- **Framework**: Next.js 16 + React 19 + TypeScript 5.9
- **Styling**: Tailwind CSS 4
- **Animations**: Motion (Framer Motion) 12.x
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: Zustand 5
- **Déploiement**: Vercel

### Backend (Cloudflare)
- **Platform**: Cloudflare Pages + Workers
- **Database**: D1 (SQLite)
- **Storage**: R2 (Object Storage)
- **API**: Pages Functions
- **Déploiement**: Wrangler CLI

## Architecture des Dossiers

\`\`\`
monorepo-duo-demo-app/
├── frontend/               # Next.js app (déployé sur Vercel)
│   ├── app/
│   │   ├── (webapp)/      # Pages utilisateur (Mini App)
│   │   │   ├── page.tsx   # Catalogue produits
│   │   │   ├── cart/      # Panier
│   │   │   ├── checkout/  # Commande
│   │   │   └── reviews/   # Avis
│   │   ├── admin/         # Panel admin
│   │   │   ├── products/  # Gestion produits
│   │   │   ├── orders/    # Gestion commandes
│   │   │   └── settings/  # Paramètres
│   │   └── api/           # API Routes (proxy vers Cloudflare)
│   ├── components/        # Composants React
│   └── lib/               # Stores, types, utils
│
├── functions/api/         # Cloudflare Pages Functions (backend)
│   ├── products/          # CRUD produits
│   ├── orders/            # CRUD commandes
│   └── categories/        # CRUD catégories
│
├── schema.sql             # Schéma D1 database
└── wrangler.toml          # Configuration Cloudflare
\`\`\`

## Base de Données (D1)

### Tables Principales

| Table | Description |
|-------|-------------|
| \`products\` | Produits (prix, images, catégorie, stock) |
| \`pricing_tiers\` | Paliers de prix par quantité (10g, 25g, 50g, 100g) |
| \`product_categories\` | Catégories de produits |
| \`orders\` | Commandes avec items JSON |
| \`reviews\` | Avis clients avec modération |
| \`drivers\` | Livreurs |
| \`settings\` | Configuration boutique (JSON) |

## Configuration Rapide

### 1. Prérequis

\`\`\`bash
# Installer Node.js 18+
node -v

# Installer Wrangler CLI (Cloudflare)
npm install -g wrangler

# Installer Vercel CLI
npm install -g vercel
\`\`\`

### 2. Cloner et Installer

\`\`\`bash
git clone https://github.com/Keiy78120/monorepo-duo-demo-app.git
cd monorepo-duo-demo-app

# Installer dépendances backend
npm install

# Installer dépendances frontend
cd frontend
npm install
cd ..
\`\`\`

### 3. Configurer Cloudflare

\`\`\`bash
# Se connecter à Cloudflare
wrangler login

# Créer bases de données D1
wrangler d1 create demo-app-prod
wrangler d1 create demo-app-staging

# Créer buckets R2 pour médias
wrangler r2 bucket create demo-app-media
wrangler r2 bucket create demo-app-media-staging

# Créer projet Pages
wrangler pages project create monorepo-duo-demo --production-branch main

# Appliquer le schéma DB
wrangler d1 execute demo-app-prod --file=./schema.sql

# Configurer les secrets
echo "YOUR_TELEGRAM_BOT_TOKEN" | wrangler pages secret put TELEGRAM_BOT_TOKEN --project-name=monorepo-duo-demo
\`\`\`

### 4. Mettre à jour wrangler.toml

Après création des ressources, copier les IDs dans \`wrangler.toml\`:

\`\`\`toml
[[d1_databases]]
binding = "DB"
database_name = "demo-app-prod"
database_id = "VOTRE_DATABASE_ID"  # ID obtenu lors de la création

[[r2_buckets]]
binding = "MEDIA"
bucket_name = "demo-app-media"
\`\`\`

### 5. Déployer

\`\`\`bash
# Déployer backend sur Cloudflare
wrangler pages deploy ./out --project-name=monorepo-duo-demo

# Déployer frontend sur Vercel
cd frontend
vercel --prod
\`\`\`

## Personnalisation pour Clients

### 1. Créer un Bot Telegram

1. Parler à [@BotFather](https://t.me/botfather) sur Telegram
2. Créer un nouveau bot: \`/newbot\`
3. Récupérer le token: \`123456789:ABCdefGHIjklMNOpqrsTUVwxyz\`
4. Configurer le bot:
   \`\`\`
   /setdomain - Définir le domaine de la mini app
   /setmenubutton - Configurer le bouton menu
   \`\`\`

### 2. Variables d'Environnement Frontend (.env.local)

\`\`\`bash
# URL de l'API Cloudflare (après déploiement backend)
CLOUDFLARE_API_URL=https://votre-projet.pages.dev

# Optionnel: Base de données PostgreSQL locale pour dev
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
\`\`\`

### 3. Branding

Fichiers à modifier pour personnaliser:

- \`frontend/app/layout.tsx\` - Metadata, titre, description
- \`frontend/public/\` - Logos, favicons
- \`frontend/lib/constants.ts\` - Nom de l'app, couleurs
- \`schema.sql\` - Données de seed (catégories, produits initiaux)

### 4. Configuration Telegram Mini App

Dans le domaine du bot (@BotFather):

\`\`\`
https://votre-frontend.vercel.app
\`\`\`

### 5. Thèmes et Styles

Modifier les thèmes dans:
- \`frontend/app/globals.css\` - Variables CSS
- \`frontend/components/navbar/\` - Styles de navigation (11 variants disponibles)

## Fonctionnalités Clés

### Client (Mini App Telegram)
- ✅ Catalogue produits avec filtres catégories
- ✅ Panier persistant (localStorage)
- ✅ Paliers de prix dynamiques (10g, 25g, 50g, 100g)
- ✅ Système d'avis avec étoiles
- ✅ Checkout + envoi commande via Telegram
- ✅ Multi-thèmes (11 variants de navbar)

### Admin (Panel Web)
- ✅ Dashboard analytics (revenus, commandes)
- ✅ CRUD produits avec upload images R2
- ✅ Gestion commandes + assignation livreurs
- ✅ Modération avis (pending/approved/rejected)
- ✅ Configuration boutique (settings JSON)
- ✅ Import menu automatique via AI (LLM)

### Backend API (Cloudflare)
- ✅ REST API pour produits, catégories, commandes
- ✅ Upload images vers R2
- ✅ Proxy média avec cache
- ✅ Intégration Groq LLM pour descriptions
- ✅ Webhook Telegram

## Pricing (Paliers de Prix)

Le système de pricing est basé sur:
- **Coût par gramme** (en centimes)
- **Marge** (pourcentage)
- **Quantités** (10g, 25g, 50g, 100g)

Calcul automatique ou personnalisation par produit dans l'admin.

## Scripts Utiles

\`\`\`bash
# Développement local frontend
cd frontend && npm run dev

# Build frontend
cd frontend && npm run build

# Développement local Cloudflare
wrangler pages dev --d1=DB=demo-app-dev --r2=MEDIA ./out

# Créer migration D1
wrangler d1 execute demo-app-prod --file=./schema.sql

# Logs Cloudflare
wrangler pages deployment tail
\`\`\`

## Support et Maintenance

### Mise à jour des Dépendances

\`\`\`bash
# Frontend
cd frontend
npm update

# Backend
npm update
\`\`\`

### Sauvegardes DB

\`\`\`bash
# Export D1
wrangler d1 export demo-app-prod --output=backup.sql

# Restaurer
wrangler d1 execute demo-app-prod --file=backup.sql
\`\`\`

### Monitoring

- **Cloudflare Dashboard**: Analytics, logs Workers
- **Vercel Dashboard**: Logs frontend, analytics
- **Telegram Bot**: Notifications commandes

## Sécurité

- ✅ Validation Telegram initData (HMAC SHA-256)
- ✅ Auth admin via Better Auth
- ✅ Whitelist Telegram IDs pour admins
- ✅ Rate limiting sur API
- ✅ Sanitization inputs
- ✅ CORS configuré

## Limitations & Notes

- **Cloudflare Free Tier**: 100k requêtes/jour, 10GB R2
- **Vercel Free**: 100GB bandwidth/mois
- **D1**: 5GB storage, 5M lectures/jour (Free)
- **Telegram Bot**: Gratuit, illimité

## Contact & Support

**Développeur**: [@yx_bot_app](https://t.me/yx_bot_app)
**GitHub**: [Keiy78120/monorepo-duo-demo-app](https://github.com/Keiy78120/monorepo-duo-demo-app)

---

**Dernière mise à jour**: 2026-01-26
