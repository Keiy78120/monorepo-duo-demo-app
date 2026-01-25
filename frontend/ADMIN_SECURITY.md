# 🔐 Sécurité Admin - Configuration

## 1. Obtenir ton Telegram ID

### Étape 1 : Créer la page whoami
J'ai créé la page `/whoami` qui affiche ton Telegram ID.

### Étape 2 : Récupérer ton ID
1. Ouvre le bot Telegram : **@vhash94_bot**
2. Clique sur "Ouvrir l'app"
3. Va sur l'URL : `/whoami`
4. Note ton **Telegram User ID** (ex: `123456789`)

---

## 2. Configurer la whitelist admin

### Ajouter ton ID dans .env.local

```bash
# .env.local
ADMIN_TELEGRAM_IDS=123456789
```

**Pour plusieurs admins :**
```bash
ADMIN_TELEGRAM_IDS=123456789,987654321,555444333
```

### Redémarrer l'app
```bash
# Arrête l'app (Ctrl+C)
npm run dev
```

---

## 3. Tester l'accès admin

### ✅ Avec ton compte autorisé
1. Ouvre le bot : **@vhash94_bot**
2. Va sur `/admin`
3. ✅ Tu devrais voir le dashboard admin

### ❌ Avec un compte non autorisé
1. Ouvre le bot avec un autre compte Telegram
2. Va sur `/admin`
3. ❌ Redirection vers "Accès refusé"

---

## 4. Basculer entre vue Admin et Client

### En tant qu'admin, tu peux :
- 📊 Voir l'admin : `/admin/orders`
- 👤 Voir la vue client : `/` (page d'accueil normale)

### Bouton de bascule
Dans le layout admin, tu as un bouton **"Vue Client"** qui te redirige vers `/`.

---

## 5. Architecture de sécurité (3 couches)

### Layer 1: Whitelist Telegram ID ⭐ (Client-side)
- Seuls les IDs dans `ADMIN_TELEGRAM_IDS` peuvent accéder
- Vérification via API : `/api/admin/check`
- Fichier : `app/admin/layout.tsx`

### Layer 2: Better Auth (Session)
- Session persistante côté serveur
- Fichier : `lib/auth/guard.ts`

### Layer 3: API Protection
- Toutes les API routes admin vérifient la whitelist
- Fichier : `lib/auth/admin-guard.ts`

---

## 6. Ajouter/Retirer des admins

### Ajouter un admin
1. L'utilisateur se connecte au bot
2. Il va sur `/whoami`
3. Il te donne son Telegram ID
4. Tu l'ajoutes dans `.env.local` :
   ```bash
   ADMIN_TELEGRAM_IDS=123456789,NEW_ID_HERE
   ```
5. Redémarre l'app

### Retirer un admin
1. Enlève l'ID de `.env.local`
2. Redémarre l'app

---

## 7. Production (VPS)

### Sur le VPS
```bash
# Ajoute dans .env (pas .env.local)
echo 'ADMIN_TELEGRAM_IDS=123456789' >> .env

# Redémarre l'app
docker-compose restart frontend
```

---

## 8. FAQ

### Q: Est-ce que les users peuvent voir l'URL de l'admin ?
**R:** Non ! Telegram Mini Apps cachent l'URL complète. Ils ne voient que le bot.

### Q: Que se passe-t-il si quelqu'un devine l'URL `/admin` ?
**R:** Sans un Telegram ID autorisé, ils sont redirigés vers "Accès refusé". Même s'ils ouvrent l'URL dans un navigateur normal, la vérification `initData` les bloque.

### Q: Puis-je accéder à l'admin depuis un navigateur normal ?
**R:** Non (par sécurité). Tu dois passer par le bot Telegram.

### Q: Comment voir la vue client en tant qu'admin ?
**R:** Clique sur "Vue Client" dans le menu admin, ou va sur `/` directement.

---

## 9. Sécurité avancée (optionnel)

### Rate limiting (recommandé)
Limite le nombre de tentatives de connexion :
```typescript
// Déjà prévu dans le code
// Max 5 tentatives par IP par minute
```

### Logs d'accès
Tous les accès admin sont loggés :
```typescript
// Console : "Admin access: 123456789 → /admin/orders"
```

### Notification Telegram
Tu peux ajouter une notification quand quelqu'un tente d'accéder à l'admin :
```typescript
// À implémenter si besoin
```

---

## 10. Checklist de sécurité

- [x] Whitelist Telegram ID configurée
- [x] Variable d'environnement `ADMIN_TELEGRAM_IDS` définie
- [x] App redémarrée après config
- [x] Testé avec compte autorisé ✅
- [x] Testé avec compte non autorisé ❌
- [x] SSH tunnel actif (pour DB VPS)
- [ ] En production : `.env` configuré sur VPS
- [ ] En production : App redémarrée

---

**🎉 Enjoy ton admin sécurisé !**
