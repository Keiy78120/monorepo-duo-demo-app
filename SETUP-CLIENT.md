# 🚀 Setup Client en 5 Minutes

Guide rapide pour déployer une instance client personnalisée.

---

## Prérequis

- Compte Telegram
- Compte Vercel (gratuit)
- Compte Cloudflare (gratuit)

---

## Étape 1: Créer votre Bot Telegram

1. Ouvrir Telegram et chercher **@BotFather**
2. Envoyer `/newbot`
3. Suivre les instructions pour choisir un nom et username
4. **Sauvegarder le token** fourni (ex: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

---

## Étape 2: Cloner et Configurer

```bash
# Cloner le repo
git clone https://github.com/your-org/monorepo-duo-demo-app.git
cd monorepo-duo-demo-app

# Copier le template d'environnement
cp .env.template .env.local

# Installer les dépendances
npm install
```

---

## Étape 3: Configuration Minimale

Ouvrir `.env.local` et remplir:

```bash
# Votre token bot Telegram (obligatoire)
TELEGRAM_BOT_TOKEN="votre_token_ici"

# Username de votre bot (obligatoire)
NEXT_PUBLIC_BOT_USERNAME="votre_bot_username"

# Votre ID Telegram pour accès admin (obligatoire)
ADMIN_TELEGRAM_IDS="votre_telegram_user_id"
```

**Comment trouver votre Telegram User ID?**
- Ouvrir [@userinfobot](https://t.me/userinfobot) sur Telegram
- Votre ID s'affichera automatiquement

---

## Étape 4: Tester en Local

```bash
cd frontend
npm run dev
```

Ouvrir http://localhost:3000 - L'app devrait fonctionner! 🎉

---

## Étape 5: Déployer sur Vercel

### Via Dashboard Vercel:

1. Aller sur [vercel.com](https://vercel.com)
2. Cliquer "Import Project"
3. Connecter votre repo GitHub
4. Configurer:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Ajouter les variables d'environnement (copier depuis `.env.local`)
6. Cliquer "Deploy"

### Via CLI:

```bash
cd frontend
npm install -g vercel
vercel --prod
```

---

## Étape 6: Configurer le Bot Telegram

Une fois déployé, récupérer votre URL Vercel (ex: `your-app.vercel.app`)

Configurer le Mini App dans @BotFather:

```
/setmenubutton
> Votre bot
> Edit menu button URL
> https://your-app.vercel.app
```

---

## ✅ C'est Fini!

Votre Mini App est maintenant disponible!

Testez-le:
1. Ouvrir votre bot sur Telegram
2. Cliquer sur le bouton menu (en bas)
3. L'app devrait s'ouvrir dans Telegram

---

## 🎨 Personnalisation (Optionnel)

### Changer le nom de l'app:

```bash
NEXT_PUBLIC_APP_NAME="Mon Shop"
```

### Changer les couleurs:

```bash
NEXT_PUBLIC_PRIMARY_COLOR="#8B5CF6"
NEXT_PUBLIC_ACCENT_COLOR="#EC4899"
```

### Ajouter un logo:

1. Placer votre logo dans `frontend/public/logo.png`
2. Ajouter dans `.env.local`:
```bash
NEXT_PUBLIC_LOGO_URL="/logo.png"
```

---

## 🆘 Besoin d'Aide?

- **Documentation complète**: Voir `README.md`
- **Problèmes**: Créer une issue sur GitHub
- **Questions**: Contacter le support

---

## 📝 Checklist Post-Déploiement

- [ ] Bot Telegram créé et configuré
- [ ] App déployée sur Vercel
- [ ] Variables d'environnement configurées
- [ ] Menu button configuré dans @BotFather
- [ ] Test de l'app dans Telegram
- [ ] Accès admin vérifié
- [ ] Base de données D1 configurée (si utilisant Cloudflare)

---

**Durée totale**: ~5-10 minutes ⚡

Bon déploiement! 🚀
