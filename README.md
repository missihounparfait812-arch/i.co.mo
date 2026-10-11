# 🪵 I.CO.MO — Menuiserie Moderne & Ebénisterie

Application web e-commerce complète pour l'entreprise artisanale de menuiserie **I.CO.MO**, avec un **backend Node.js / Express**, une base de données **SQLite** intégrée, une **authentification JWT sécurisée**, et une interface d'administration autonome pour gérer le catalogue de produits sans modifier le code.

---

## 🏛️ Architecture du Projet

Le projet est structuré selon les standards modernes, avec une séparation nette entre le frontend et le backend :

```
projet i.c.o.m.o 2/
├── backend/                       # ⚙️ TOUT LE BACKEND CENTRALISÉ
│   ├── config/                    # Configuration globale & variables d'environnement
│   │   └── index.js
│   ├── controllers/               # Logique métier et requêtes SQL
│   │   ├── authController.js      # Authentification JWT & bcrypt
│   │   ├── produitController.js   # CRUD produits & gestion d'images
│   │   ├── categorieController.js # CRUD catégories de meubles
│   │   ├── commandeController.js  # Commandes clients & statistiques dashboard
│   │   └── parametreController.js # Réglages WhatsApp & coordonnées
│   ├── middleware/                # Filtres et sécurité
│   │   ├── auth.js                # Protection par jeton JWT
│   │   ├── upload.js              # Multer pour téléversement d'images
│   │   └── validation.js          # Validation des données entrantes
│   ├── models/                    # Modèle de données SQLite
│   │   └── database.js            # Initialisation schéma & connexion native
│   ├── routes/                    # Points d'accès REST API
│   │   ├── index.js               # Routeur maître (/api)
│   │   ├── authRoutes.js          # /api/auth/*
│   │   ├── produitRoutes.js       # /api/produits/*
│   │   ├── categorieRoutes.js     # /api/categories/*
│   │   ├── commandeRoutes.js      # /api/commandes/*
│   │   ├── parametreRoutes.js     # /api/parametres/*
│   │   └── adminRoutes.js         # /api/admin/* (protégé)
│   ├── services/
│   │   └── imageService.js        # Nettoyage et gestion des fichiers images
│   ├── data/                      # Stockage SQLite (icomo.db)
│   ├── server.js                  # Point d'entrée serveur Express
│   └── seed.js                    # Initialisation des 10 produits et du compte admin
│
├── css/                           # Styles Vanilla CSS
│   └── style.css
├── images/                        # Dossier des photos de meubles & uploads
├── js/                            # JavaScript Frontend
│   ├── api.js                     # 🆕 Client API centralisé (fetch wrapper)
│   ├── admin.js                   # Dashboard d'administration connecté à l'API
│   ├── produits.js                # Catalogue & synchronisation avec le backend
│   ├── panier.js                  # Panier, calculs & transmission des commandes
│   └── app.js                     # Navigation, thème sombre & interactions
│
├── index.html                     # Page d'accueil vitrine
├── produits.html                  # Catalogue complet avec filtres
├── produit.html                   # Fiche détaillée d'un meuble
├── panier.html                    # Panier & validation de commande
├── contact.html                   # Devis sur-mesure & coordonnées
├── admin.html                     # Espace d'administration sécurisé
├── .env                           # Variables d'environnement locales (non commité)
├── .env.example                   # Modèle de configuration
├── package.json                   # Dépendances Node.js
└── README.md                      # Documentation
```

---

## 🚀 Démarrage Rapide

### 1. Prérequis
- **Node.js** (version 20 ou supérieure — version 24 recommandée, aucune compilation C++ requise grâce à `node:sqlite`).

### 2. Installation des dépendances
```bash
npm install
```

### 3. Initialiser la base de données
Cette commande crée les tables SQLite, configure l'administrateur avec un mot de passe chiffré (`bcrypt`), et insère les 10 produits initiaux ainsi que leurs photos :
```bash
npm run seed
```

### 4. Démarrer le serveur
```bash
npm start
```
*(ou `npm run dev` pour recharger automatiquement en cas de modification)*

L'application est immédiatement accessible sur :
- **Boutique client :** [http://localhost:3000](http://localhost:3000)
- **Espace Administrateur :** [http://localhost:3000/admin.html](http://localhost:3000/admin.html)
- **API REST :** [http://localhost:3000/api](http://localhost:3000/api)

---

## 🔐 Identifiants Administrateur

Le compte d'administration par défaut configuré lors du seed :

- **Identifiant :** `admin`
- **Mot de passe :** `Admin@Icomo2026!` *(défini dans le fichier `.env`)*

> 🔒 **Sécurité réelle :**
> - Les mots de passe sont hachés avec **bcrypt** (sel 10 rounds).
> - L'accès à l'API admin requiert un token **JWT** valide dans le header `Authorization: Bearer <token>` ou via cookie `httpOnly`.
> - Une protection contre les attaques par force brute (**rate limiting**) bloque les tentatives abusives sur `/api/auth/login`.

---

## 📦 Fonctionnalités d'Administration Autonome

Depuis l'espace `admin.html`, vous pouvez désormais gérer votre activité sans toucher au code :

1. **Dashboard en temps réel :**
   - Nombre total de meubles et état de publication.
   - Disponibilité en atelier.
   - Suivi des commandes reçues.
   - Chiffre d'affaires cumulé.

2. **Gestion complète des meubles (CRUD) :**
   - **Ajout :** Nom, catégorie, prix en FCFA, dimensions, matériau, couleur, description, statut disponible/indisponible.
   - **Photos :** Téléversement direct de photos depuis votre appareil (stockées dans `images/` et référencées en base).
   - **Modification :** Mise à jour instantanée des tarifs ou descriptions.
   - **Publication :** Mettre un produit en brouillon ou en ligne en un clic.
   - **Suppression :** Supprime le produit et ses fichiers photos du disque.

3. **Suivi des commandes :**
   - Dès qu'un client valide son panier via WhatsApp, la commande est enregistrée dans la base de données avec sa référence unique (`CMD-2026-XXXX`).
   - L'administrateur peut modifier le statut : `En attente` ➔ `Confirmée` ➔ `En fabrication` ➔ `Livrée` ➔ `Annulée`.

4. **Paramètres de l'entreprise :**
   - Mise à jour du numéro WhatsApp, téléphone, adresse, email et horaires d'atelier.

---

## 📡 Documentation des Endpoints API

### Endpoints Publics

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/health` | Vérification de l'état de l'API |
| `GET` | `/api/produits` | Liste des produits publiés (filtres : `categorie`, `recherche`, `tri`) |
| `GET` | `/api/produits/:id` | Détails d'un meuble spécifique |
| `GET` | `/api/categories` | Liste des catégories avec nombre de produits |
| `POST` | `/api/commandes` | Création d'une commande client |
| `GET` | `/api/parametres/public` | Paramètres publics (WhatsApp, contact) |

### Endpoints Administrateur (Authentification requise)

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Connexion administrateur (retourne JWT) |
| `POST` | `/api/auth/logout` | Déconnexion |
| `GET` | `/api/auth/check` | Vérifie la validité du token JWT |
| `GET` | `/api/admin/statistiques` | Indicateurs clés du tableau de bord |
| `GET` | `/api/admin/produits` | Liste exhaustive des meubles (y compris brouillons) |
| `POST` | `/api/admin/produits` | Création d'un meuble avec upload d'images (multipart/form-data) |
| `PUT` | `/api/admin/produits/:id` | Modification d'un meuble |
| `DELETE` | `/api/admin/produits/:id` | Suppression d'un meuble et de ses images |
| `PATCH` | `/api/admin/produits/:id/disponibilite` | Bascule disponible / indisponible |
| `PATCH` | `/api/admin/produits/:id/publication` | Bascule publié / brouillon |
| `GET` | `/api/admin/commandes` | Liste de toutes les commandes |
| `PATCH` | `/api/admin/commandes/:id/statut` | Mise à jour du statut d'une commande |
| `DELETE` | `/api/admin/commandes/:id` | Suppression d'une commande |
| `GET` | `/api/admin/parametres` | Récupération de tous les paramètres |
| `PUT` | `/api/admin/parametres` | Mise à jour des paramètres du site |

---

## 🛡️ Bonnes pratiques de Sécurité Appliquées

- **Aucun mot de passe en clair** : Hachage avec `bcryptjs`.
- **Protection brute-force** : `express-rate-limit` restreint les tentatives sur le formulaire de connexion.
- **En-têtes de sécurité** : `helmet` protège contre les attaques XSS, clickjacking et injection de scripts.
- **Sanitisation des entrées** : Tous les champs envoyés par les clients et l'admin sont validés et typés avant insertion SQL.
- **Fichiers sécurisés** : Contrôle strict du type MIME et de la taille maximale des images téléversées (Multer, max 5 Mo).
- **Isolation des secrets** : Variables sensibles isolées dans `.env` et exclues du versionnage Git.
