# Coding Agent Prompt — Demo Cannabis Ordering App

## 1. Objectif général

Cette application est une **version simplifiée et démonstrative** destinée à mes clients.  
Une version plus avancée existera ultérieurement, mais **ce scope concerne uniquement la version demo / MVP**.

L’objectif est de :
- Présenter des produits (catalogue)
- Permettre l’ajout au panier
- Générer un résumé de commande
- Envoyer ce résumé via **Telegram** à un compte défini (le gérant)

⚠️ Aucun paiement en ligne, aucune gestion de livraison automatisée.

Le produit vendu est du **cannabis en livraison**.  
L’UX doit être **simple, rapide et sans friction**.

---

## 2. Contraintes techniques (non négociables)

- Hébergement **100 % Cloudflare (Free Tier)**
- Cloudflare Pages / Workers
- Stockage média : **Cloudflare R2** (images + vidéos)
- Aucun service payant
- Architecture **serverless uniquement**

---

## 3. Côté Client (Frontend)

### Fonctionnalités à conserver
- Navigation produits
- Détails produit (image, prix, description)
- Ajout au panier
- **Theme switcher (clair / sombre) — à conserver absolument**

### Processus de commande (à modifier)
- Pas de checkout classique
- À la validation :
  - Générer un **résumé clair de la commande**
  - Envoyer ce résumé via **Telegram**
  - Le destinataire Telegram est **paramétrable dans l’app**
  - Le @Telegram correspond au gérant des commandes

➡️ Aucune confirmation automatique côté client.

---

## 4. Côté Admin (Backend léger)

Le **côté admin doit être extrêmement rapide et simple**, pensé pour des utilisateurs non techniques.

### Fonctionnalités Admin
- Dashboard simple
- Ajouter / modifier / supprimer des produits
- Supprimer des avis
- Activer / désactiver le mode maintenance
- Paramétrer le @Telegram recevant les commandes
- Upload images / vidéos via R2

### Gestion des rôles
- **Admin principal**
  - Accès total
  - Accès maintenance
  - Accès bouton **NUKE**
- **Modérateurs**
  - Gestion produits & avis
  - ❌ Pas de maintenance
  - ❌ Pas de NUKE

---

## 5. Bouton "NUKE"

Fonction **réservée à l’admin principal**.

Objectif :
- Supprimer **l’intégralité du projet** en cas de problème critique

Contraintes :
- Action irréversible
- Double confirmation obligatoire
- Suppression des données + désactivation app

---

## 6. Fonctions à supprimer

### Admin Side — À SUPPRIMER
- Toutes les fonctions IA
- Page contact
- Fonctions drivers / livreurs
- Paramètres non listés explicitement

### Client Side
- Conserver l’existant
- Modifier uniquement le système de commande

---

## 7. Authentification & Sécurité

Contraintes :
- Clients non techniques
- Pas de credentials complexes

Approche souhaitée :
- Admin principal ajouté manuellement **ou**
- Accès via **PIN / code unique**

➡️ Solution simple, explicable, sécurisée (1–2 options max).

---

## 8. Priorités absolues

1. Simplicité d’utilisation
2. Rapidité UX & performance
3. Code clair et maintenable
4. Séparation nette :
   - Client
   - Admin
   - Rôles

---

## 9. Attentes vis-à-vis de l’agent

- Respect strict du scope
- Aucune feature non demandée
- Choix techniques compatibles Cloudflare Free Tier
- Architecture évolutive sans sur-ingénierie
