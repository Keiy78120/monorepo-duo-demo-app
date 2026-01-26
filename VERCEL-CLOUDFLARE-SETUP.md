# 🔗 Vercel ↔ Cloudflare Configuration

**Architecture**: Frontend (Vercel) + Backend API (Cloudflare)

---

## ✅ Configuration Actuelle

### Frontend (Vercel)
- **Projet**: `vhash-app`
- **URL**: https://monorepo-duo-demo-app.vercel.app
- **Framework**: Next.js 16

### Backend API (Cloudflare)
- **Projet**: `monorepo-duo-demo`
- **URL**: https://monorepo-duo-demo.pages.dev
- **Database**: D1 (SQLite)
- **Storage**: R2 (Objects)

---

## 🔄 Comment Ça Marche

```
User Request
    ↓
Vercel Frontend (Next.js)
    ↓
Middleware Proxy (/api/*)
    ↓
Cloudflare Pages Functions
    ↓
D1 Database
```

### Flux de Requête

1. **User** visite https://monorepo-duo-demo-app.vercel.app
2. **Frontend** charge depuis Vercel
3. **API call** (e.g., `/api/products`)
4. **Middleware** intercepte et proxy vers Cloudflare
5. **Cloudflare** traite avec D1 et retourne les données
6. **Frontend** affiche les résultats

---

## 📝 Variables d'Environnement

### Vercel (Production)

| Variable | Valeur | Description |
|----------|--------|-------------|
| `CLOUDFLARE_API_URL` | `https://monorepo-duo-demo.pages.dev` | Backend API URL |
| `TELEGRAM_BOT_TOKEN` | *Encrypted* | Bot token (@BotFather) |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | *Encrypted* | Bot username |
| `ADMIN_TELEGRAM_IDS` | *(empty for demo)* | Admin user IDs |

### Cloudflare (Production)

| Variable | Valeur | Description |
|----------|--------|-------------|
| `TELEGRAM_BOT_TOKEN` | *Secret* | Bot token |
| `ADMIN_TELEGRAM_IDS` | *Secret* | Admin user IDs |
| `ADMIN_SESSION_SECRET` | *Secret* | Session encryption |

---

## 🔐 Sécurité

### CORS
- Cloudflare autorise les requêtes depuis Vercel
- Header `Access-Control-Allow-Origin` configuré
- Credentials inclus pour auth

### Authentication
- **Demo Mode**: Admin accessible à tous (pour démo)
- **Client Mode**: Auth Telegram obligatoire
- **Session**: Gérée via cookies sécurisés

---

## 🚀 Déploiement

### Vercel (Frontend)

```bash
# Auto-déployé via GitHub push
git push origin main

# Ou déploiement manuel
cd frontend
vercel --prod
```

### Cloudflare (Backend)

```bash
# Déployer les Pages Functions
wrangler pages deploy

# Vérifier le déploiement
wrangler pages deployment list --project-name=monorepo-duo-demo
```

---

## 🧪 Tests de Connexion

### Test 1: API Health Check

```bash
# Test direct Cloudflare
curl https://monorepo-duo-demo.pages.dev/api/products

# Test via Vercel proxy
curl https://monorepo-duo-demo-app.vercel.app/api/products
```

**Résultat attendu**: Les deux doivent retourner la même réponse JSON

### Test 2: CORS

```bash
curl -H "Origin: https://monorepo-duo-demo-app.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -X OPTIONS \
  https://monorepo-duo-demo.pages.dev/api/products
```

**Résultat attendu**: Headers CORS présents dans la réponse

### Test 3: Demo Session

```bash
# Créer une session démo
curl -X POST https://monorepo-duo-demo-app.vercel.app/api/orders \
  -H "Content-Type: application/json" \
  -H "x-demo-session-id: test-session-123" \
  -d '{
    "items": [{"product_id": "test", "name": "Test", "quantity": 1, "price": 1000}],
    "total": 1000,
    "currency": "EUR",
    "delivery_address": "Test Address"
  }'
```

---

## 🔧 Troubleshooting

### Erreur: 500 Internal Server Error

**Symptôme**: Tous les appels API retournent 500

**Solutions**:
1. Vérifier que `CLOUDFLARE_API_URL` est configuré sur Vercel
2. Vérifier que Cloudflare Pages est déployé
3. Vérifier les logs Cloudflare: `wrangler pages deployment tail`

### Erreur: CORS Policy

**Symptôme**: Erreur CORS dans la console

**Solutions**:
1. Vérifier que l'origine Vercel est autorisée sur Cloudflare
2. Ajouter à `ALLOWED_ORIGINS`: `https://monorepo-duo-demo-app.vercel.app`
3. Redéployer Cloudflare Pages

### Erreur: Failed to fetch

**Symptôme**: Network error, impossible de joindre l'API

**Solutions**:
1. Vérifier que Cloudflare Pages est en ligne
2. Tester l'URL directement dans le navigateur
3. Vérifier que le middleware proxy fonctionne

---

## 📊 Monitoring

### Logs Vercel

```bash
vercel logs
```

### Logs Cloudflare

```bash
wrangler pages deployment tail --project-name=monorepo-duo-demo
```

### Métriques

- **Vercel Dashboard**: https://vercel.com/keiys-projects/vhash-app
- **Cloudflare Dashboard**: https://dash.cloudflare.com/.../pages/view/monorepo-duo-demo

---

## 🔄 Mise à Jour de l'URL

Si vous changez l'URL Vercel:

1. **Mettre à jour CORS sur Cloudflare**:
```bash
wrangler pages secret put ALLOWED_ORIGINS
# Entrer: https://nouvelle-url.vercel.app,https://localhost:3000
```

2. **Redéployer**:
```bash
wrangler pages deploy
```

3. **Tester** la nouvelle configuration

---

## 📝 Notes pour Clients

Quand vous clonez cette app pour un client:

1. **Configurer le Bot Telegram**:
   - Créer bot via @BotFather
   - Mettre `TELEGRAM_BOT_TOKEN` sur Vercel ET Cloudflare

2. **Configurer les Admin IDs**:
   - Trouver ID via @userinfobot
   - Mettre `ADMIN_TELEGRAM_IDS` sur Vercel ET Cloudflare

3. **Déployer**:
   - Push to GitHub → Auto-deploy Vercel
   - `wrangler pages deploy` → Deploy Cloudflare

4. **Vérifier**:
   - Tester l'URL Vercel
   - Vérifier que l'API fonctionne
   - Tester l'authentification admin

---

**Dernière mise à jour**: 2026-01-26
**Status**: ✅ Configuré et fonctionnel
