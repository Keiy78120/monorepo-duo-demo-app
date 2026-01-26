# 🛠️ Developer Guide

Guide complet pour développer, tester et déployer l'application.

---

## 📐 Architecture

### Stack
```
Frontend: Vercel (Next.js 16)
   ↓ Middleware Proxy
Backend: Cloudflare Pages Functions
   ↓
Database: D1 (SQLite)
Storage: R2 (Objects)
```

### URLs
- **Production**: https://monorepo-duo-demo-app.vercel.app
- **API Backend**: https://monorepo-duo-demo.pages.dev
- **Telegram Bot**: [@yx_bot_app](https://t.me/yx_bot_app)

---

## 🚀 Quick Start

```bash
# 1. Clone
git clone https://github.com/Keiy78120/monorepo-duo-demo-app.git
cd monorepo-duo-demo-app

# 2. Install
npm install
cd frontend && npm install

# 3. Setup env (copy from .env.template)
cp .env.template .env.local

# 4. Run dev server
npm run dev
```

---

## 🗄️ Database

### Migration
```bash
# Production
wrangler d1 execute demo-app-prod --remote --file=./migration-demo-session.sql

# Local
wrangler d1 execute demo-app-dev --local --file=./schema.sql
```

### Schema Key Tables
- `products` - Catalogue + pricing tiers
- `orders` - Commandes (+ `demo_session_id` pour isolation)
- `reviews` - Avis (+ `demo_session_id`)
- `telegram_contacts` - Users Telegram
- `settings` - Configuration JSON

---

## 🧪 Testing

### Quick Test Suite

**Test 1: Mode Selection**
```bash
# Visit homepage
open http://localhost:3000

# Expected:
✓ ModeSelector displays
✓ Title centered (not vertical)
✓ Two demo options visible
```

**Test 2: Session Isolation**
```bash
# Window 1 (Chrome)
- Select "Simple"
- Create order
- Note session ID in localStorage

# Window 2 (Firefox)
- Select "Advanced"
- Check admin → orders
- Should NOT see Window 1's order
```

**Test 3: Admin Access**
```bash
# Demo mode
- Select any mode
- Check for red shield button (top-right)
- Click → should access /admin
- No authentication required
```

### API Tests

```bash
# Test Cloudflare backend directly
curl https://monorepo-duo-demo.pages.dev/api/products

# Test via Vercel proxy
curl https://monorepo-duo-demo-app.vercel.app/api/products

# Should return same JSON response
```

---

## 🔧 Configuration

### Environment Variables

**Vercel (Production)**
```bash
CLOUDFLARE_API_URL=https://monorepo-duo-demo.pages.dev
TELEGRAM_BOT_TOKEN=123456:ABC...
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot
ADMIN_TELEGRAM_IDS= # Empty for demo mode
```

**Cloudflare (Secrets)**
```bash
wrangler pages secret put TELEGRAM_BOT_TOKEN
wrangler pages secret put ADMIN_TELEGRAM_IDS
wrangler pages secret put ADMIN_SESSION_SECRET
```

### Change Vercel URL

Si vous changez l'URL Vercel (rename project ou custom domain):

```bash
# 1. Update CORS on Cloudflare
wrangler pages secret put ALLOWED_ORIGINS
# Enter: https://nouvelle-url.vercel.app,https://localhost:3000

# 2. Redeploy
wrangler pages deploy

# 3. Test
curl -H "Origin: https://nouvelle-url.vercel.app" \
  https://monorepo-duo-demo.pages.dev/api/products
```

---

## 📦 Deployment

### Vercel (Auto)
```bash
git push origin main
# Auto-deploys to production
```

### Vercel (Manual)
```bash
cd frontend
vercel --prod
```

### Cloudflare Pages
```bash
wrangler pages deploy
```

---

## 🐛 Troubleshooting

### API Returns 500 Errors

**Cause**: Frontend can't reach backend

**Fix**:
1. Check `CLOUDFLARE_API_URL` is set on Vercel
2. Verify Cloudflare Pages is deployed
3. Check middleware.ts is proxying correctly

```bash
# Check Vercel env
vercel env ls | grep CLOUDFLARE

# Check Cloudflare deployment
wrangler pages deployment list
```

### CORS Errors

**Cause**: Origin not allowed by Cloudflare

**Fix**:
```bash
# Add Vercel URL to allowed origins
wrangler pages secret put ALLOWED_ORIGINS
# Enter: https://your-app.vercel.app,https://localhost:3000

# Redeploy
wrangler pages deploy
```

### Admin Button Not Showing

**Cause**: Demo session not loaded

**Fix**: Clear localStorage and refresh
```javascript
localStorage.clear();
location.reload();
```

### Build Fails on Vercel

**Cause**: TypeScript errors or missing deps

**Fix**:
```bash
# Test build locally
npm run build

# Check logs
vercel logs
```

---

## 🔐 Demo Mode Features

### Session Isolation
- Each user gets unique UUID
- Stored in localStorage
- Sent as `x-demo-session-id` header
- Backend filters by `demo_session_id`

### Admin Access
- No Telegram auth required
- Automatic with demo session
- Full admin features enabled

### Data Cleanup
Recommend periodic cleanup of demo data:

```sql
-- Delete demo orders older than 24h
DELETE FROM orders
WHERE demo_session_id IS NOT NULL
AND created_at < datetime('now', '-1 day');

-- Delete demo reviews older than 24h
DELETE FROM reviews
WHERE demo_session_id IS NOT NULL
AND created_at < datetime('now', '-1 day');
```

---

## 📊 Monitoring

### Logs

```bash
# Vercel
vercel logs

# Cloudflare
wrangler pages deployment tail
```

### Metrics
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Cloudflare Analytics**: Dashboard → Pages → monorepo-duo-demo

---

## 🔄 Client Setup Process

Pour cloner l'app pour un client, voir `SETUP-CLIENT.md`.

Résumé rapide:
1. Clone repo
2. Configure `.env.local`
3. Set `TELEGRAM_BOT_TOKEN` et `ADMIN_TELEGRAM_IDS`
4. Deploy to Vercel
5. Configure Telegram bot menu button

---

## 📝 Code Structure

```
frontend/
├── app/
│   ├── (webapp)/          # User pages
│   │   ├── page.tsx       # Catalog
│   │   ├── cart/          # Shopping cart
│   │   └── checkout/      # Order flow
│   ├── admin/             # Admin panel
│   └── api/               # API routes (proxy)
├── components/            # React components
├── lib/
│   ├── store/            # Zustand stores
│   │   ├── demo-session.ts
│   │   └── app-mode.ts
│   └── api/
│       └── demo-fetch.ts # Session header injection
└── middleware.ts          # Cloudflare proxy

functions/api/             # Cloudflare Pages Functions
├── products/
├── orders/
└── reviews/
```

---

## 🎯 Key Implementation Details

### Demo Session Flow
1. User selects mode → UUID generated
2. Stored in localStorage (`demo-session-id`)
3. `demoFetch()` injects header in all API calls
4. Backend filters data by `demo_session_id`

### Middleware Proxy
- Intercepts all `/api/*` requests
- Forwards to Cloudflare Pages backend
- Preserves headers (including demo session)
- Returns response transparently

### Admin Access Logic
```typescript
// PageHeader.tsx
if (demoSessionId) {
  setIsAdmin(true); // Instant admin access
} else if (userId) {
  checkAdminAPI(); // Telegram verification
}
```

---

## 📖 Additional Resources

- **Setup Guide**: `SETUP-CLIENT.md`
- **Project Context**: `CONTEXTE.md`
- **Main README**: `README.md`
- **GitHub Issues**: https://github.com/Keiy78120/monorepo-duo-demo-app/issues

---

**Last Updated**: 2026-01-26
