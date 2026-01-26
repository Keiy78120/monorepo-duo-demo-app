# ⚠️ IMPORTANT: Mise à Jour URL Vercel → Cloudflare

Si vous changez l'URL Vercel du projet, vous **devez** mettre à jour la configuration Cloudflare pour permettre les requêtes CORS.

---

## 🔄 Quand Faire Cette Mise à Jour

Quand vous:
- Renommez le projet Vercel
- Changez de domaine custom
- Déployez sur une nouvelle instance

**URL actuelle**: `https://monorepo-duo-demo-app.vercel.app`

---

## 📝 Étapes de Mise à Jour

### 1. Mettre à Jour les Variables d'Environnement Cloudflare

```bash
# Se connecter à Cloudflare
wrangler login

# Mettre à jour la variable ALLOWED_ORIGINS
wrangler pages secret put ALLOWED_ORIGINS
# Entrer: https://votre-nouvelle-url.vercel.app,https://localhost:3000
```

### 2. Mettre à Jour wrangler.toml (si nécessaire)

Si vous avez des références hardcodées à l'URL Vercel dans `wrangler.toml`, les mettre à jour:

```toml
# Chercher et remplacer les URLs
# Exemple:
[vars]
FRONTEND_URL = "https://votre-nouvelle-url.vercel.app"
```

**Note**: Actuellement, wrangler.toml n'a pas de référence directe à l'URL Vercel frontend.

### 3. Mettre à Jour CORS dans Pages Functions (si applicable)

Si vous avez des fichiers `functions/_middleware.ts` ou similaires avec configuration CORS:

```typescript
// Chercher et mettre à jour:
const allowedOrigins = [
  'https://votre-nouvelle-url.vercel.app',
  'https://localhost:3000'
];
```

### 4. Vérifier les Headers CORS

Chercher dans tous les fichiers API pour les headers CORS hardcodés:

```bash
cd /Users/keiy/Documents/Developer/telegram-app/monorepo-duo-demo-app
grep -r "Access-Control-Allow-Origin" functions/
```

Si vous trouvez des références, les mettre à jour.

### 5. Tester Après Changement

```bash
# Depuis le frontend Vercel, tester un appel API Cloudflare
curl -H "Origin: https://votre-nouvelle-url.vercel.app" \
  https://your-cloudflare-pages.pages.dev/api/products

# Vérifier les headers de réponse
# Devrait contenir:
# Access-Control-Allow-Origin: https://votre-nouvelle-url.vercel.app
```

---

## 🔍 Checklist Post-Changement

- [ ] Variables Cloudflare mises à jour (ALLOWED_ORIGINS)
- [ ] wrangler.toml vérifié (si applicable)
- [ ] Fichiers _middleware.ts vérifiés
- [ ] Headers CORS testés
- [ ] API calls depuis Vercel testent OK
- [ ] Aucune erreur CORS dans la console

---

## 🆘 Dépannage

### Erreur: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Solution**:
1. Vérifier que `ALLOWED_ORIGINS` contient la nouvelle URL
2. Redéployer les Pages Functions: `wrangler pages deploy`
3. Vider le cache Cloudflare si nécessaire

### Les requêtes API échouent après changement d'URL

**Solution**:
1. Vérifier les DevTools → Network → Headers
2. Confirmer que l'origin envoyé correspond à l'URL Vercel
3. Vérifier les logs Cloudflare Pages

---

## 📋 Template de Commandes

```bash
#!/bin/bash

# Script rapide pour changer l'URL Vercel

NEW_URL="https://votre-nouvelle-url.vercel.app"

echo "🔄 Mise à jour de l'URL Vercel → Cloudflare"
echo "Nouvelle URL: $NEW_URL"

# 1. Mettre à jour les secrets Cloudflare
echo "$NEW_URL,https://localhost:3000" | wrangler pages secret put ALLOWED_ORIGINS

# 2. Rechercher les références hardcodées
echo "🔍 Recherche de références à l'ancienne URL..."
grep -r "monorepo-duo-demo-app.vercel.app" .

# 3. Redéployer
echo "📤 Redéploiement..."
wrangler pages deploy

echo "✅ Mise à jour terminée!"
echo "⚠️  N'oubliez pas de tester les appels API depuis le frontend"
```

---

## 📝 Notes

- Les URLs localhost doivent toujours rester dans ALLOWED_ORIGINS pour le dev local
- Pensez à mettre à jour également les URLs dans:
  - Telegram Bot configuration (@BotFather menu button URL)
  - Documentation (README.md, CONTEXTE.md)
  - Variables d'environnement Vercel (si NEXT_PUBLIC_APP_URL)

---

**Dernière mise à jour**: 2026-01-26
**URL actuelle**: https://monorepo-duo-demo-app.vercel.app
