# 🛵 AdduGo

**AdduGo** est une plateforme e-commerce et de livraison à la demande conçue pour la Guinée. Elle connecte les clients, les commerçants et les livreurs en temps réel dans une interface moderne et intuitive.

---

## 📸 Aperçu

> Une application multi-espaces pensée pour le marché guinéen, avec des prix en **Franc Guinéen (GNF)** et une interface adaptée aux usages locaux.

---

## ✨ Fonctionnalités

### 🛍️ Espace Client
- Parcourir les boutiques et produits disponibles
- Recherche et filtrage par catégorie et prix
- Gestion du panier multi-boutiques
- Suivi de commandes en temps réel avec code PIN de livraison sécurisé
- Historique des commandes
- Messagerie intégrée avec les commerçants
- Tableau de bord personnel

### 🏪 Espace Commerçant (Ma Boutique)
- Gestion complète du catalogue produits (ajout, modification, suppression)
- Suivi des commandes reçues
- Statistiques de ventes (CA, Top produits, évolution des revenus)
- Messagerie avec les clients
- Profil et configuration de la boutique

### 🛵 Espace Livreur
- Tableau de bord avec les livraisons assignées
- Gestion des courses (accepter, démarrer, terminer)
- Confirmation de livraison via code PIN client
- Statistiques de gains et courses effectuées
- Messagerie intégrée

### 🔐 Espace Administrateur
- Gestion des utilisateurs (clients, commerçants, livreurs)
- Supervision des commandes et livraisons
- Gestion des commerces inscrits
- Statistiques globales de la plateforme

---

## 🛠️ Stack Technique

### Frontend
| Technologie | Usage |
|---|---|
| HTML5 / CSS3 | Structure et mise en page |
| JavaScript (Vanilla) | Logique côté client |
| Font Awesome | Icônes |
| Chart.js | Graphiques et statistiques |
| Socket.io (client) | Messagerie temps réel |

### Backend
| Technologie | Usage |
|---|---|
| Node.js | Runtime serveur |
| Express.js v5 | Framework API REST |
| MariaDB | Base de données |
| Socket.io | Messagerie temps réel |
| JWT | Authentification par token |
| bcryptjs | Hachage des mots de passe |
| Multer | Upload de fichiers / images |
| Helmet | Sécurité HTTP |
| dotenv | Variables d'environnement |

### Hébergement
| Service | Usage |
|---|---|
| Railway | Backend + Base de données |
| Netlify / Railway | Frontend statique |

---

## 📁 Structure du Projet

```
AdduGo/
├── backend/
│   ├── config/          # Configuration base de données
│   ├── controllers/     # Logique métier (auth, orders, products...)
│   ├── middlewares/     # Authentification JWT, upload
│   ├── models/          # Modèles de données
│   ├── routes/          # Définition des routes API
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── productRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── commerceRoutes.js
│   │   ├── livreurRoutes.js
│   │   ├── messageRoutes.js
│   │   └── adminRoutes.js
│   ├── uploads/         # Fichiers uploadés (images)
│   └── server.js        # Point d'entrée du serveur
│
└── frontend/
    ├── assets/
    │   ├── css/         # Feuilles de style par espace
    │   ├── js/          # Scripts par espace
    │   └── images/      # Images et assets
    └── pages/
        ├── accueil/     # Login, Register
        ├── espace-client/
        ├── espace-livreur/
        ├── ma-boutique/ # Espace commerçant
        ├── mes-shoppings/
        └── espace-admin/
```

---

## ⚙️ Installation & Lancement

### Prérequis
- Node.js ≥ 18
- MariaDB / MySQL
- Git

### 1. Cloner le projet
```bash
git clone https://github.com/ton-compte/addugo.git
cd AdduGo
```

### 2. Installer les dépendances backend
```bash
cd backend
npm install
```

### 3. Configurer les variables d'environnement
Créer un fichier `.env` dans le dossier `backend/` :
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=ton_mot_de_passe
DB_NAME=addugo

JWT_SECRET=une_cle_secrete_longue_et_complexe

PORT=3000
```

### 4. Lancer le serveur
```bash
# En développement
npm run dev

# En production
npm start
```

### 5. Ouvrir le frontend
Ouvrir `frontend/index.html` dans un navigateur, ou servir les fichiers avec un serveur statique.

---

## 🔌 API Endpoints Principaux

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Inscription |
| POST | `/api/auth/login` | Connexion |
| GET | `/api/produits` | Liste des produits |
| GET | `/api/commandes` | Commandes de l'utilisateur |
| POST | `/api/commandes` | Créer une commande |
| GET | `/api/commerces/:id/statistiques` | Stats d'un commerce |
| GET | `/api/messages/:conversationId` | Messages d'une conversation |
| GET | `/api/admin/utilisateurs` | Liste des utilisateurs (admin) |

---

## 🌍 Spécificités Guinéennes

- 💰 Tous les prix sont affichés en **Franc Guinéen (GNF)**
- 📱 Interface optimisée pour mobile
- 🛵 Système de livraison adapté au contexte local
- 🔒 Code PIN sécurisé pour la confirmation de livraison

---

## 👤 Auteur

**Kevin Panafrikaka**  
Développeur Full-Stack

---

## 📄 Licence

Ce projet est propriétaire. Tous droits réservés © 2025 AdduGo.
