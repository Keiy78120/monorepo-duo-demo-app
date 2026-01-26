# monorepo-duo-demo-app

Telegram Mini App démo avec multi-user sessions et intégration Cloudflare (Pages + D1 + R2).

**🌐 Production**: [monorepo-duo-demo-app.vercel.app](https://monorepo-duo-demo-app.vercel.app)
**🤖 Bot**: [@yx_bot_app](https://t.me/yx_bot_app)

---

## 📚 Documentation

| Fichier | Description |
|---------|-------------|
| **SETUP-CLIENT.md** | 🚀 Guide rapide 5 min pour cloner l'app |
| **DEVELOPER-GUIDE.md** | 🛠️ Architecture, tests, troubleshooting complet |
| **CONTEXTE.md** | 📖 Contexte technique du projet |

---

## ✨ Features

### Multi-User Demo Mode
- **Session isolée** par utilisateur (UUID unique)
- **Pas de Telegram requis** pour tester
- **Mode Simple** ou **Advanced** au choix
- **Admin ouvert** à tous en démo

### Stack
```
Frontend (Vercel) → Middleware → Cloudflare API → D1 Database
```

- Next.js 16 + React 19 + TypeScript
- Cloudflare Pages Functions + D1 (SQLite)
- Zustand state management
- Tailwind CSS + Motion animations

---

## 🚀 Quick Start

### Cloner pour un Client

```bash
# 1. Clone
git clone https://github.com/Keiy78120/monorepo-duo-demo-app.git
cd monorepo-duo-demo-app

# 2. Setup interactif (5 min)
bash scripts/client-setup.sh

# 3. Deploy
cd frontend && vercel --prod
```

Voir **`SETUP-CLIENT.md`** pour le guide complet.

### Développement Local

```bash
# Install
npm install
cd frontend && npm install

# Configure Cloudflare
wrangler login
wrangler d1 create demo-app-dev

# Apply schema
wrangler d1 execute demo-app-dev --local --file=./schema.sql

# Run dev
npm run dev
```

Voir **`DEVELOPER-GUIDE.md`** pour les détails complets.

---

## 📦 Déploiement

### Vercel (Frontend)
```bash
cd frontend
vercel --prod
```

### Cloudflare (Backend API)
```bash
wrangler pages deploy
```

---

## 🔑 Variables d'Environnement

**Essentielles**:
- `TELEGRAM_BOT_TOKEN` - Token du bot (@BotFather)
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` - Username du bot
- `ADMIN_TELEGRAM_IDS` - IDs admin (vide pour démo)
- `CLOUDFLARE_API_URL` - URL backend Cloudflare

Voir `.env.template` pour la liste complète.

---

## 📖 Guides

### Pour les Clients
→ **SETUP-CLIENT.md** - Configuration en 5 minutes

### Pour les Développeurs
→ **DEVELOPER-GUIDE.md** - Architecture, tests, troubleshooting

### Contexte Technique
→ **CONTEXTE.md** - Stack, features, fichiers clés

---

## 🆘 Support

- **Issues**: https://github.com/Keiy78120/monorepo-duo-demo-app/issues
- **Documentation**: Voir les fichiers MD ci-dessus

---

## 📄 License

Propriétaire - Voir LICENSE
