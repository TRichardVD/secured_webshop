# Secured Webshop - TRD

Ce repository contient le projet Secured Webshop, réalisé dans le cadre du cours [ICT-183 - Sécurité des applications](https://www.modulbaukasten.ch/module/183/3/). Ce projet vise à développer une application Node.js sécurisée, mettant l'accent sur la gestion des utilisateurs, l'authentification sécurisée et la protection contre les attaques courantes.

L'objectif principal est de comprendre et d'implémenter les concepts de sécurité dans une application web, tout en respectant les normes étudiées dans les modules précédents.

## Prérequis

Avant de démarrer, assurez-vous d'avoir installé :

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (pour la conteneurisation)
- [Node.js](https://nodejs.org/) (version LTS recommandée)
- [Git](https://git-scm.com/) (pour cloner le repository)

## Démarrer le projet

### Étape 1 : Cloner le repository

```bash
git clone https://github.com/votre-utilisateur/Secured-Webshop.git
cd Secured-Webshop
```

### Étape 2 : Lancer Docker

Exécutez la commande suivante pour démarrer les services nécessaires :

```bash
docker-compose up
```

### Étape 3 : Générer les certificats HTTPS

Dans le dossier `/app/certificats`, exécutez ces commandes depuis Git Bash :

```bash
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
```

### Étape 4 : Installer les dépendances

Depuis le dossier `./app`, installez les dépendances Node.js :

```bash
npm install
```

### Étape 5 : Lancer l'application

Démarrez le serveur avec :

```bash
npm run start
```

Accédez ensuite à l'application via [https://localhost/](https://localhost/).

## ✅ Checklist des tâches à développé

- [x] Génération et utilisation de certificats HTTPS.
- [x] Page d'accueil
- [x] Profil du client
- [x] Authentification via JWT et compte utilisateur.
- [x] Gestion des rôles (utilisateur/admin).
- [x] Page d'administration
- [x] Protection contre les injections SQL sans ORM.
- [x] Documentation complète avec JSDoc.
- [ ] Authentification via une API tierce (OAuth 2.0, MSAL)
- [ ] Ajout sur la page de login l'affichage de message d'erreur ou des messages de succès d'une opération
- [ ] Hashage avec bcrypt avec salage et poivrage (actuellement uniquement avec `Scrypt`).
- [ ] Ajout de logs détaillés pour faciliter le débogage.
- [ ] Optimisation et refactorisation des routes backend.
