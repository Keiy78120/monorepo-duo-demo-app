# vhash-cloudflare-app

Telegram Mini App migrated to Cloudflare (Pages + Workers + D1 + R2).

## Architecture

- **Cloudflare Pages** - Static frontend hosting
- **Pages Functions** - API routes (Workers)
- **D1** - SQLite database
- **R2** - Object storage for media

## Prerequisites

- Node.js >= 18
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account

## Quick Start

### 1. Setup Cloudflare Resources

```bash
# Login to Cloudflare
wrangler login

# Create D1 databases
wrangler d1 create vhash-prod
wrangler d1 create vhash-staging

# Create R2 buckets
wrangler r2 bucket create vhash-media
wrangler r2 bucket create vhash-media-staging

# Create Pages project
wrangler pages project create vhash-cloudflare-app
```

### 2. Configure wrangler.toml

Update `wrangler.toml` with your database IDs:

```toml
[[d1_databases]]
binding = "DB"
database_name = "vhash-prod"
database_id = "YOUR_PROD_DATABASE_ID"  # From step 1
```

### 3. Apply Schema

```bash
# Production
wrangler d1 execute vhash-prod --file=./schema.sql

# Staging
wrangler d1 execute vhash-staging --file=./schema.sql

# Local development
wrangler d1 execute vhash-dev --local --file=./schema.sql
```

### 4. Set Secrets

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put ADMIN_SESSION_SECRET
wrangler secret put ADMIN_TELEGRAM_IDS
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Local Development

```bash
npm run dev
```

## Data Migration

### Export from PostgreSQL

1. Set up environment:
```bash
cp .env.example .env.local
# Edit .env.local with your PostgreSQL connection string
```

2. Export data:
```bash
npm run migration:export
```

### Import to D1

1. Generate SQL:
```bash
npm run migration:import
```

2. Apply to D1:
```bash
wrangler d1 execute vhash-prod --file=./data/import.sql
```

### Migrate Media

```bash
npm run migration:media
```

## Deployment

```bash
# Production
npm run deploy

# Staging
npm run deploy:staging
```

## API Routes

| Endpoint | Methods | Auth | Description |
|----------|---------|------|-------------|
| `/api/products` | GET, POST | Public/Admin | Product catalog |
| `/api/products/:id` | GET, PUT, DELETE | Public/Admin | Single product |
| `/api/categories` | GET, POST | Public/Admin | Product categories |
| `/api/categories/:id` | GET, PUT, DELETE | Public/Admin | Single category |
| `/api/pricing-tiers` | GET, POST, PUT | Public/Admin | Pricing tiers |
| `/api/orders` | GET, POST | Admin/Public | Orders |
| `/api/orders/:id` | GET, PUT, DELETE | User/Admin | Single order |
| `/api/orders/user` | GET | User | User's orders |
| `/api/reviews` | GET, POST | Public | Reviews |
| `/api/reviews/:id` | GET, PUT, DELETE | Public/Admin | Single review |
| `/api/drivers` | GET, POST | Admin | Drivers |
| `/api/drivers/:id` | GET, PUT, DELETE | Admin | Single driver |
| `/api/settings` | GET, PUT | Public/Admin | Settings |
| `/api/telegram/verify` | POST | Public | Verify Telegram initData |
| `/api/upload` | POST, DELETE | Admin | File upload/delete |
| `/api/admin/check` | GET | Public | Check admin status |
| `/api/admin/session` | DELETE | Public | Logout |
| `/api/admin/contacts` | GET, PUT | Admin | Telegram contacts |

## Free Tier Limits

| Service | Limit |
|---------|-------|
| Workers | 100k requests/day, 10ms CPU/request |
| D1 | 5M reads/day, 100k writes/day, 5GB storage |
| R2 | 10GB storage, 1M Class A ops, 10M Class B ops/month |
| Pages | 500 builds/month |

## Project Structure

```
vhash-cloudflare-app/
├── functions/api/          # API routes (Pages Functions)
│   ├── products/
│   ├── categories/
│   ├── pricing-tiers/
│   ├── orders/
│   ├── reviews/
│   ├── drivers/
│   ├── settings/
│   ├── telegram/
│   ├── upload/
│   └── admin/
├── src/lib/                # Shared utilities
│   ├── db.ts               # D1 database client
│   ├── auth.ts             # Authentication
│   ├── telegram.ts         # Telegram verification
│   ├── r2.ts               # R2 storage helpers
│   └── types.ts            # TypeScript types
├── scripts/migration/      # Migration scripts
├── schema.sql              # D1 schema
├── wrangler.toml           # Cloudflare config
└── package.json
```

## Authentication

The app uses a custom authentication system based on Telegram initData verification:

1. User opens Mini App in Telegram
2. Frontend sends `initData` to `/api/telegram/verify`
3. Backend verifies using HMAC-SHA256 (Web Crypto API)
4. If admin, sets `tg_admin` cookie (JWT-like token)

Admin is determined by:
- `ADMIN_TELEGRAM_IDS` environment variable
- `is_admin` field in `telegram_contacts` table

## Development

### Type Checking

```bash
npm run typecheck
```

### Adding New Routes

1. Create file in `functions/api/`
2. Export `onRequestGet`, `onRequestPost`, etc.
3. Use `requireAdmin()` for protected routes

Example:
```typescript
import type { Env } from '../../src/lib/db';
import { requireAdmin } from '../../src/lib/auth';

export async function onRequestGet(context: { request: Request; env: Env }) {
  await requireAdmin(context.request, context.env.DB, context.env.ADMIN_SESSION_SECRET, context.env.ADMIN_TELEGRAM_IDS);
  // Handle request
}
```

## Troubleshooting

### "Browser not installed"
```bash
wrangler pages dev --d1=DB=vhash-dev ./out
```

### Database errors
```bash
# Check D1 status
wrangler d1 info vhash-prod

# Execute raw SQL
wrangler d1 execute vhash-prod --command "SELECT * FROM settings"
```

### R2 upload errors
Ensure R2 bucket is correctly bound in `wrangler.toml`.
