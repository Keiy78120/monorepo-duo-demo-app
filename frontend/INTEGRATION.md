## Zero-Knowledge Vault — Multi-Admins & Rôles

### Objectif
Mettre en place un système **zero-knowledge** garantissant que :
- les données sensibles sont chiffrées côté navigateur
- personne (y compris l’équipe technique) ne peut lire les données
- un seul admin fondateur contrôle le coffre
- d’autres admins / modérateurs peuvent être ajoutés avec des accès limités

---

## Rôles

### 1. Admin Fondateur (Vault Owner)
- Premier admin créé
- Seul autorisé à :
  - créer le Vault (passphrase + recovery key)
  - déverrouiller le Vault
  - inviter / gérer les autres admins
  - définir leurs permissions
- Détient la **responsabilité totale des données**

### 2. Admin Secondaire
- Accès admin avec permissions avancées
- Peut :
  - voir les commandes
  - gérer les produits
  - assigner des drivers
- Ne peut PAS :
  - créer ou modifier le Vault
  - changer la passphrase
  - voir les données si le Vault n’est pas déverrouillé

### 3. Modérateur
- Accès limité
- Peut :
  - consulter certaines sections (ex : commandes sans données sensibles)
  - modérer les avis
- Ne peut PAS :
  - voir les données chiffrées (adresse, détails clients)
  - modifier les paramètres sensibles
  - accéder au Vault

---

## Création du Vault (ONE SHOT)

### Règle fondamentale
- **Le Vault ne peut être créé qu’une seule fois**
- **Uniquement par le premier admin (Vault Owner)**

### Premier accès admin
Si aucun Vault n’existe :
- afficher uniquement l’écran **Create Vault**
- bloquer toute autre navigation

Écran Create Vault :
- Passphrase (champ obligatoire)
- Confirmation passphrase
- Génération automatique d’une **Recovery Key**
- Actions obligatoires :
  - Copier la Recovery Key
  - Télécharger la Recovery Key
  - Checkbox “J’ai bien sauvegardé”

Une fois validé :
- le Vault est marqué comme `initialized = true`
- le salt + version sont stockés
- aucune autre création possible

---

## Déverrouillage du Vault

- Seul le **Vault Owner** peut déverrouiller le Vault
- Le déverrouillage :
  - charge la clé en mémoire navigateur
  - permet le déchiffrement des données sensibles
- Les autres admins :
  - voient uniquement les données autorisées
  - n’ont jamais accès à la clé

Option :
- “Rester déverrouillé X heures” (clé conservée en mémoire chiffrée côté client)

---

## Chiffrement (rappel technique)

- Dérivation clé :
  - Argon2id (ou scrypt)
  - salt stocké en DB
- Chiffrement :
  - AES-GCM via WebCrypto
- La passphrase et la recovery key :
  - ne transitent jamais par le serveur
  - ne sont jamais stockées

---

## Données chiffrées (OBLIGATOIRE)

À chiffrer intégralement :
- adresses complètes
- items de commandes
- telegram_username
- notes internes
- toute information permettant d’identifier un client

---

## Données en clair (pour UX / permissions)

Restent en clair :
- order_day
- daily_order_number
- status
- driver_id
- total_price (optionnel)
- role des utilisateurs admin

---

## Permissions par rôle (exemple)

| Fonction                    | Owner | Admin | Modérateur |
|----------------------------|:-----:|:-----:|:----------:|
| Déverrouiller le Vault     |  ✅   |  ❌   |    ❌      |
| Voir adresses clients      |  ✅   |  ❌   |    ❌      |
| Voir commandes (global)    |  ✅   |  ✅   |    ⚠️*     |
| Gérer produits             |  ✅   |  ✅   |    ❌      |
| Assigner drivers           |  ✅   |  ✅   |    ❌      |
| Gérer avis                 |  ✅   |  ✅   |    ✅      |
| Gérer les rôles            |  ✅   |  ❌   |    ❌      |

⚠️ Modérateur : uniquement données non sensibles.

---

## Fallback (Recovery)

- Seul le Vault Owner peut utiliser la Recovery Key
- Permet de :
  - recréer une nouvelle passphrase
  - conserver les données existantes
- Si passphrase + recovery key sont perdues :
  - données définitivement inaccessibles
  - aucun reset serveur possible (volontaire)

---

## Règle de sécurité absolue

AUCUN code serveur ne doit :
- recevoir la passphrase
- recevoir la recovery key
- déchiffrer des données

Objectif final :
> Un seul responsable détient la clé des données.  
> Les autres travaillent sans jamais y avoir accès.
