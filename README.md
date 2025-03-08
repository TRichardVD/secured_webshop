# Secured Webshop - TRD

Ce repository contient le projet Secured Webshop, réalisé dans le cadre du cours [ICT-183 - Sécurité des applications](https://www.modulbaukasten.ch/module/183/3/). Ce projet vise à développer une application Node.js sécurisée, mettant l'accent sur la gestion des utilisateurs, l'authentification sécurisée et la protection contre les attaques courantes.

L'objectif principal est de comprendre et d'implémenter les concepts de sécurité dans une application web, tout en respectant les normes étudiées dans les modules précédents.

## Prérequis

Avant de démarrer, assurez-vous d'avoir installé les éléments suivants :

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (pour la conteneurisation)
- [Node.js](https://nodejs.org/) (version LTS recommandée)
- [Git](https://git-scm.com/) (pour cloner le référentiel)

## Démarrer le projet

### Étape 1 : Cloner le référentiel

Ouvrez un terminal et exécutez la commande suivante pour cloner le référentiel :

```bash
git clone https://github.com/TRichardVD/secured_webshop.git
cd secured_webshop
```

### Étape 2 : Lancer Docker

Exécutez la commande suivante pour démarrer les services nécessaires :

```bash
docker-compose up
```

### Étape 3 : Générer les certificats HTTPS

Dans le dossier `/app/certificats`, ouvrez un terminal Git Bash et exécutez les commandes suivantes pour générer les certificats HTTPS :

```bash
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
```

### Étape 4 : Configurer le fichier `.env`

Pour configurer votre application, veuillez compléter les valeurs dans le modèle du fichier `.env` présent dans [`.env.example`](./app/.env.example) ou ci-dessous, puis placez-le dans le répertoire `/app` sous le nom de fichier `.env`. Ce fichier contient des clés secrètes et des informations d'authentification pour votre application.

```bash
PRIVATE_KEY = "PRIVATE_KEY"     # This is a secret key for signing the session cookie
POIVRE = "POIVRE"

# Github Auth
CLIENT_ID = "CLIENT_ID"         # This is the client ID you got from Github
CLIENT_SECRET = "CLIENT_SECRET" # This is the client secret you got from Github

# Database configuration
DB_HOST = "localhost"
DB_PORT = 6033
DB_USER = "root"
DB_PASSWORD = "root"
DB_NAME = "db_webstore"

# Encryption
ENCRYPTION_KEY = "ENCRYPT" # This is the key used for encrypting sensitive data
```

### Étape 5 : Lancer l'application

Démarrez le serveur avec la commande suivante :

```bash
npm run start
```

> Les dépendances sont automatiquement installées en même temps que le lancement du serveur pour éviter les oublis d'installation des dépendances.
> Accédez ensuite à l'application via [https://localhost/](https://localhost/).

## ✅ Checklist des tâches à développées

- [x] Génération et utilisation de certificats HTTPS.
- [x] Page d'accueil
- [x] Profil du client
- [x] Authentification via JWT et compte utilisateur.
- [x] Gestion des rôles (utilisateur/admin).
- [x] Page d'administration
- [x] Protection contre les injections SQL sans ORM.
- [x] Documentation complète avec JSDoc.
- [x] Authentification via une API tierce (ici Github) (OAuth 2.0, MSAL)
- [x] Modification pour de la page home afin d'utiliser EJS
- [x] Hashage avec `bcrypt` avec salage et poivrage (actuellement uniquement avec `Scrypt`).
- [x] Ajout dans `isLogin` une vérification si la connexion github est toujours valide
- [x] dockerisation de l'application web
- [x] Ajout d'un middleware auth pour simplifier la vérification
- [x] Ajout d'un chiffrement sur les token OAuth2.0
- [ ] Ajout sur la page de login l'affichage de message d'erreur ou des messages de succès d'une opération
- [ ] Ajout de logs détaillés pour faciliter le débogage et l'accès à des logs.
- [ ] Optimisation et refactorisation des routes backend.
