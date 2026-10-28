# Backend API REST Laravel 9 (MongoDB)

Ce dossier contient le code source complet, structuré et prêt à l'emploi d'un backend d'API REST robuste développé avec **PHP Laravel 9**, utilisant **MongoDB** comme base de données principale et authentification sécurisée par **JWT (JSON Web Tokens)**.

---

## 🏗️ Architecture du Projet

Le code est organisé selon le modèle MVC classique de Laravel, adapté pour une architecture d'API REST :

```text
laravel-backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/   # Contrôleurs REST (Auth, Produits, Commandes, etc.)
│   │   ├── Middleware/    # Authentification JWT & Protection Rôle Administrateur
│   │   └── Requests/      # Validation des requêtes HTTP (Form Requests)
│   └── Models/            # Modèles Eloquent configurés pour MongoDB
├── database/
│   ├── migrations/        # Définition des schémas de collections MongoDB
│   └── seeders/           # Données de test initiales (Seeders)
├── routes/
│   └── api.php            # Définition de l'ensemble des Endpoints de l'API REST
└── README.md              # Ce guide d'installation et de lancement
```

---

## 🛠️ Instructions d'Installation & Lancement

Suivez les étapes ci-dessous pour configurer et lancer l'API Laravel sur votre machine locale ou serveur :

### 1. Prérequis
- **PHP 8.1 ou supérieur**
- **Composer** (Gestionnaire de dépendances PHP)
- **Extension MongoDB pour PHP** installée et activée (`mongodb.so` ou `php_mongodb.dll`)
- **Serveur MongoDB actif** (local ou instance cloud MongoDB Atlas)

### 2. Installation des Dépendances
Dans votre terminal, naviguez dans ce dossier et exécutez la commande suivante :
```bash
composer install
```

### 3. Configuration de l'Environnement (`.env`)
Copiez le fichier d'exemple `.env.example` vers un nouveau fichier `.env` :
```bash
cp .env.example .env
```
Ouvrez le fichier `.env` et ajustez les variables pour connecter votre base de données MongoDB :
```env
DB_CONNECTION=mongodb
DB_HOST=127.0.0.1
DB_PORT=27017
DB_DATABASE=premium_shop_db
DB_USERNAME=
DB_PASSWORD=
```

### 4. Génération des Clés de Sécurité
Générez la clé de chiffrement principale de Laravel ainsi que le secret JWT pour signer les jetons d'authentification :
```bash
php artisan key:generate
php artisan jwt:secret
```

### 5. Exécution des Migrations & Seeders
Exécutez les migrations pour configurer les collections MongoDB, puis peuplez la base de données avec des produits, catégories, coupons, avis et utilisateurs de démonstration :
```bash
php artisan migrate --seed
```

### 6. Lancement du Serveur de Développement
Démarrez le serveur local de Laravel :
```bash
php artisan serve --port=8000
```
L'API REST sera accessible à l'adresse suivante : **`http://127.0.0.1:8000/api`**.

---

## 📦 Identifiants de Connexion Démo (Seedés)

- **Compte Client standard :**
  - **Email :** `thomas@example.com`
  - **Mot de passe :** `password123`
- **Compte Administrateur :**
  - **Email :** `admin@ecommerce.com`
  - **Mot de passe :** `admin123`
