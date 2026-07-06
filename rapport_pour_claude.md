# 📋 Rapport Complet — Projet AdduGo

**Date :** 29 Juin 2026  
**État :** Prototype avancé — Backend opérationnel + Frontend MPA en cours de refonte  
**Stack :** Node.js / Express · MySQL · HTML5 / CSS3 / JavaScript Vanilla (Fetch API)

---

## 1. 🎯 Objectif du Projet

AdduGo est une plateforme de **e-commerce et de livraison multi-rôles**. Un même compte utilisateur peut évoluer librement entre les espaces : Client, Commerçant, Livreur, et Admin.

---

## 2. 🎭 Architecture des Rôles

Un utilisateur peut posséder **plusieurs rôles simultanément** (table de liaison `utilisateur_roles`).

| Rôle | Description |
|---|---|
| `client` | Rôle par défaut à l'inscription. Commande des produits. |
| `commerce` | Crée et gère une ou plusieurs boutiques + produits. |
| `livreur` | Accepte des missions de livraison, gère sa disponibilité. |
| `admin` | Accès global à l'administration de la plateforme. |

---

## 3. ✅ Fonctionnalités Réalisées

### Authentification & Onboarding
- Inscription simplifiée : prénom, nom, email, mot de passe → rôle `client` attribué automatiquement.
- Connexion avec JWT. Si l'utilisateur a **plusieurs rôles**, un **modal de sélection d'espace** apparaît.
- Page d'**onboarding obligatoire** post-inscription pour uploader photo de profil (obligatoire) et photo de couverture (facultatif).
- Les uploads sont gérés par `multer`, stockés dans `backend/uploads/`.

### Gestion du Profil (Unifié)
- Chaque espace (client, commerce, livreur, admin) possède sa propre page `profil.html` avec la sidebar adaptée à son rôle.
- Un seul fichier JS partagé `shared-profil.js` gère la logique : chargement des infos, modification du profil, changement de mot de passe, upload de photo de profil et de couverture.
- **La photo de profil est la même partout** (stockée dans `utilisateurs.photo_profil`).

### Création de Boutique (Évolution de compte)
- Depuis le tableau de bord Client, l'utilisateur peut cliquer sur "Créer ma boutique".
- Une **modale** s'ouvre et demande obligatoirement : Nom de la boutique + Catégorie + Logo (image).
- Après validation, le rôle `commerce` est **attribué automatiquement** et la boutique est créée.
- Un utilisateur peut posséder **plusieurs boutiques** (relation 1-N dans `commerces`).

### Évolution vers l'espace Livreur
- Depuis le tableau de bord Client, un bouton permet d'activer l'espace Livreur (confirmation simple).
- Le rôle `livreur` est attribué via l'API `POST /api/utilisateurs/role`.

### Espace Administration
- Dashboard avec statistiques globales.
- Gestion des Utilisateurs, Commerces, Commandes, Livraisons (pages dédiées avec tableaux).

---

## 4. 📂 Structure Complète du Projet

```
AdduGo/
│
├── backend/
│   ├── config/
│   │   ├── db.js                     # Pool de connexions MySQL (mysql2/promise)
│   │   └── addugo.sql                # Schéma DDL complet de la base de données
│   │
│   ├── controllers/
│   │   ├── authController.js         # register(), login()
│   │   ├── userController.js         # getProfil(), updateProfil(), updatePassword(), updatePhoto(), updateRole()
│   │   ├── commerceController.js     # creerCommerce(), listerCommerces(), voirCommerce(), mesCommerces()
│   │   ├── productController.js      # CRUD Produits
│   │   ├── orderController.js        # CRUD Commandes
│   │   ├── livreurController.js      # Gestion disponibilité, livraisons
│   │   ├── adminController.js        # Administration globale
│   │   └── deliveryController.js     # [Vide — à implémenter]
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js         # Vérifie et décode le JWT, injecte req.utilisateur
│   │   └── adminMiddleware.js        # Vérifie que req.utilisateur a le rôle admin
│   │
│   ├── routes/
│   │   ├── authRoutes.js             # POST /api/auth/register, /api/auth/login
│   │   ├── userRoutes.js             # GET/PUT /api/utilisateurs/...
│   │   ├── commerceRoutes.js         # GET/POST /api/commerces/... (avec multer pour logo)
│   │   ├── productRoutes.js          # GET/POST/PUT/DELETE /api/produits/...
│   │   ├── orderRoutes.js            # GET/POST /api/commandes/...
│   │   ├── livreurRoutes.js          # GET/PUT /api/livreur/...
│   │   ├── adminRoutes.js            # GET/PUT /api/admin/...
│   │   └── deliveryRoutes.js         # [Vide — à implémenter]
│   │
│   ├── uploads/                      # Stockage local des fichiers uploadés par multer
│   │   ├── avatars/                  # Photos de profil et de couverture
│   │   └── commerces/                # Logos des boutiques
│   │
│   └── server.js                     # Serveur Express — Port 3000
│
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── style.css             # Variables CSS globales (couleurs, polices, composants)
│   │   │   └── dashboard.css         # Layout avec sidebar + navbar + contenu
│   │   ├── img/                      # Assets visuels statiques
│   │   └── js/
│   │       ├── api.js                # apiFetch() — Wrapper global Fetch (JWT auto-injecté)
│   │       ├── auth.js               # Logique login/register + modal sélection de rôle
│   │       ├── onboarding.js         # Upload photo de profil et de couverture
│   │       ├── shared-profil.js      # Logique profil unifiée pour TOUS les espaces
│   │       ├── dashboard-client.js   # Espace Client : évolution de compte + modale boutique
│   │       ├── dashboard-commerce.js # Espace Commerce : stats boutique
│   │       ├── dashboard-livreur.js  # Espace Livreur : disponibilité, stats
│   │       ├── dashboard-admin.js    # Espace Admin : statistiques globales
│   │       ├── commandes-client.js   # Historique commandes côté client
│   │       ├── commandes-commerce.js # Commandes reçues côté vendeur
│   │       ├── produits-commerce.js  # Gestion produits (CRUD)
│   │       ├── livraisons-livreur.js # Gestion livraisons côté livreur
│   │       ├── suivi-client.js       # Suivi de livraison en temps réel
│   │       ├── statistiques-admin.js # Graphiques et stats admin
│   │       ├── admin-utilisateurs.js # Table des utilisateurs
│   │       ├── admin-commerces.js    # Table des commerces
│   │       ├── admin-commandes.js    # Table des commandes
│   │       └── admin-livraisons.js   # Table des livraisons
│   │
│   ├── pages/
│   │   ├── login.html                # Connexion avec modal de sélection de rôle
│   │   ├── register.html             # Inscription (nom, prénom, email, mot de passe)
│   │   ├── onboarding.html           # Étape post-inscription : photos
│   │   │
│   │   ├── admin/                    # Interface Administrateur
│   │   │   ├── dashboard.html
│   │   │   ├── profil.html
│   │   │   ├── utilisateurs.html
│   │   │   ├── commerces.html
│   │   │   ├── commandes.html
│   │   │   ├── livraisons.html
│   │   │   └── statistiques.html
│   │   │
│   │   ├── client/                   # Interface Client (ACTUELLE — à remplacer par nouvelle archi)
│   │   │   ├── dashboard.html        # Contient section "Évolution de compte" + modale boutique
│   │   │   ├── profil.html
│   │   │   ├── commandes.html
│   │   │   └── suivi.html
│   │   │
│   │   ├── commerce/                 # Interface Commerçant
│   │   │   ├── dashboard.html
│   │   │   ├── profil.html
│   │   │   ├── produits.html
│   │   │   └── commandes.html
│   │   │
│   │   └── livreur/                  # Interface Livreur
│   │       ├── dashboard.html
│   │       ├── profil.html
│   │       └── livraisons.html
│   │
│   └── index.html                    # Landing Page publique (non connecté)
│
└── rapport_pour_claude.md            # Ce fichier
```

---

## 5. 🗄 Schéma Base de Données (Résumé)

| Table | Colonnes clés |
|---|---|
| `utilisateurs` | id, nom, prenom, email, mot_de_passe (hash), photo_profil, photo_couverture |
| `roles` | id, nom (`client`, `commerce`, `livreur`, `admin`) |
| `utilisateur_roles` | utilisateur_id, role_id *(relation N-M)* |
| `commerces` | id, utilisateur_id, nom, description, logo, adresse, telephone |
| `produits` | id, commerce_id, nom, description, prix, image, stock |
| `commandes` | id, utilisateur_id, commerce_id, livreur_id, statut, adresse_livraison |
| `commande_items` | commande_id, produit_id, quantite, prix_unitaire |

---

## 6. 🖥 NOUVELLE Architecture d'Interface Proposée par l'Utilisateur

> ⚠️ **CHANTIER EN COURS** — L'utilisateur a proposé une refonte complète de l'interface principale. Voici l'architecture validée à implémenter.

### Concept général
Après connexion ou inscription, **toutes les pages** de l'application (quel que soit le rôle) partagent le **même layout de base** :

```
┌─────────────────────────────────────────────────────────────────────┐
│  NAVBAR (fixe, en haut)                                             │
│  Logo AdduGo | Catégories ▼ | Recherche | 🔔 | 🛒 | Vendre         │
├────────────┬────────────────────────────────────────────────────────┤
│  SIDEBAR   │  CONTENU PRINCIPAL                                     │
│  (gauche,  │                                                        │
│  fixe)     │  "Bienvenue sur AdduGo, [Prénom]"                     │
│            │                                                        │
│  [Photo]   │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  Prénom    │  │Produit│ │Produit│ │Produit│ │Produit│  ← grille    │
│  Nom       │  │ img  │ │ img  │ │ img  │ │ img  │   infinie      │
│            │  │ desc │ │ desc │ │ desc │ │ desc │                 │
│ Mon Compte │  │ prix │ │ prix │ │ prix │ │ prix │                 │
│            │  └──────┘ └──────┘ └──────┘ └──────┘               │
│ Notifs     │                                                        │
│            │  ...chargement progressif des produits...             │
│ Mes Espaces│                                                        │
│ > Client   │                                                        │
│ > Commerce │                                                        │
│ > Livreur  │                                                        │
│ > Admin    │                                                        │
│            │                                                        │
│ Boutiques  │                                                        │
│ Produits   │                                                        │
│            │                                                        │
│ Aide       │                                                        │
│            │                                                        │
│ Déconnexion│                                                        │
└────────────┴────────────────────────────────────────────────────────┘
```

### Détail de la NAVBAR (supérieure)
- **Gauche** : Logo `AdduGo`
- **Centre** : Dropdown "Toutes les Catégories" + Barre de Recherche
- **Droite** : Icône Messages 💬 · Icône Commandes 📦 · Icône Panier 🛒 · Bouton "Vendre sur AdduGo"

### Détail de la SIDEBAR (gauche, fixe)
```
┌─────────────────────┐
│  [Photo de profil]  │
│  Prénom Nom         │
├─────────────────────┤
│  Mon Compte         │
├─────────────────────┤
│  Notifications      │
├─────────────────────┤
│  Mes Espaces        │
│   → Espace Client   │
│   → Espace Commerce │
│   → Espace Livreur  │
│   → Espace Admin    │  ← visible uniquement si rôle admin
├─────────────────────┤
│  Boutiques          │
│  Tous les produits  │
│  Parcourir          │
├─────────────────────┤
│  Centre d'aide      │
├─────────────────────┤
│  Se déconnecter     │
└─────────────────────┘
```

### Contenu Central (Feed de produits)
- Message d'accueil personnalisé : `"Bienvenue sur AdduGo, [Prénom]"`
- Grille de produits en **chargement progressif (infinite scroll)** :
  - Image du produit
  - Nom + Description courte
  - Prix
  - Bouton "Ajouter au panier" / "Voir la boutique"

---

## 7. 🔜 Prochaines Étapes à Implémenter (Priorité)

1. **[PRIORITÉ 1] Refonte du layout principal** : Créer le nouveau `home.html` avec la sidebar + navbar + feed de produits. Ce fichier remplace `client/dashboard.html` comme page d'accueil post-connexion.
2. **[PRIORITÉ 2] Tunnel d'achat** : Panier → Validation commande → Confirmation.
3. **[PRIORITÉ 3] Gestion Produits** : Finaliser le CRUD produits côté commerce.
4. **[PRIORITÉ 4] Assignation Livraisons** : L'espace livreur doit afficher les commandes disponibles à accepter.
5. **[PRIORITÉ 5] Landing Page Publique** : Habiller `index.html` pour les visiteurs non connectés.

---

## 8. ⚙️ Informations Techniques pour Lancer le Projet

```bash
# Démarrer le backend
cd AdduGo/backend
npm start
# → Serveur sur http://localhost:3000

# Ouvrir le frontend
# Ouvrir frontend/pages/login.html dans le navigateur
# (ou utiliser Live Server sur VS Code)
```

**Variables d'environnement** : fichier `.env` à la racine de `/backend` :
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=...
DB_NAME=addugo
JWT_SECRET=...
```

---

*Rapport rédigé le 29 Juin 2026 — Prêt à être transmis à Claude.*
