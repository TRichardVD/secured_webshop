// Importation des modules nécessaires
const express = require("express");
const https = require("https");
const fs = require("fs");
const db = require("./model/database");
const path = require("path");
const UserController = require("./controllers/UserController");
const SessionController = require("./controllers/SessionController");
const cookieParser = require("cookie-parser");

// Initialisation de l'application Express
const app = express();

/**
 * Configuration des certificats SSL/TLS pour le serveur HTTPS
 * @type {Object}
 */
const credentials = {
  key: fs.readFileSync("./certificats/server.key"), // Clé privée
  cert: fs.readFileSync("./certificats/server.crt"), // Certificat public
};

// Utilisation du middleware pour servir des fichiers statiques depuis le dossier "public"
app.use(express.static("public"));
// Utilisation du middleware pour parser les cookies de la requête
app.use(cookieParser());

/**
 * Gestion de la page d'accueil. Vérifie si l'utilisateur est connecté.
 * Si connecté, affiche la page d'accueil, sinon redirige vers la page de connexion.
 */
app.get("/", async (req, res) => {
  try {
    // Vérifie si l'utilisateur est connecté via le token dans les cookies
    await SessionController.isLogin(req.cookies.token);
  } catch (err) {
    console.log(err); // Enregistre l'erreur
    return res.redirect("/login"); // Redirige vers la page de connexion
  }

  // Envoie la page d'accueil ssi l'utilisateur est connecté
  return res.sendFile(path.join(__dirname, "vue/home.html"));
});

/**
 * Gestion de la page de connexion. Vérifie si l'utilisateur est déjà connecté.
 * Si connecté, redirige vers la page utilisateur, sinon affiche la page de connexion.
 */
app.get("/login", async (req, res) => {
  try {
    // Vérifie si l'utilisateur est connecté via le token dans les cookies
    await SessionController.isLogin(req.cookies.token);
  } catch (err) {
    console.log(err); // Enregistre l'erreur
    // Envoie la page de connexion ssi l'utilisateur n'est pas connecté
    return res.sendFile(path.join(__dirname, "./vue/login.html"));
  }

  // Redirige vers la page utilisateur ssi l'utilisateur est déjà connecté
  return res.redirect("/user");
});

/**
 * Gestion de la page d'inscription. Vérifie si l'utilisateur est déjà connecté.
 * Si connecté, redirige vers la page utilisateur, sinon affiche la page d'inscription.
 */
app.get("/register", async (req, res) => {
  try {
    // Vérifie si l'utilisateur est connecté via le token dans les cookies
    await SessionController.isLogin(req.cookies.token);
  } catch (err) {
    console.log(err); // Enregistre l'erreur
    // Envoie la page d'inscription ssi l'utilisateur n'est pas connecté
    return res.sendFile(path.join(__dirname, "vue/register.html"));
  }

  // Redirige vers la page utilisateur ssi l'utilisateur est déjà connecté
  return res.redirect("/user");
});

// Utilisation des routes utilisateur
app.use("/user", require("./routes/User"));

/**
 * Gestion de la page d'administration. Vérifie si l'utilisateur est connecté et administrateur.
 * Si connecté et administrateur, affiche la page de dashboard d'admin, sinon renvoie une erreur 403.
 */
app.get("/admin", async (req, res) => {
  try {
    // Vérifie si l'utilisateur est connecté via le token dans les cookies
    const userinfos = await SessionController.isLogin(req.cookies.token);

    // Vérifie si l'utilisateur est administrateur
    if (userinfos.isAdmin === 1) {
      // Affiche la page de dashboard d'admin
      return res
        .status(200)
        .sendFile(path.join(__dirname, "./vue/adminDashboard.html"));
    } else {
      // Accès refusé si l'utilisateur n'est pas administrateur
      res.status(403).send("Access denied");
    }
  } catch (err) {
    console.log(err); // Enregistre l'erreur
    // Renvoie une erreur interne (500) si une erreur se produit
    return res
      .status(500)
      .send("Une erreur est survenue veuillez reessayer plus tard");
  }
});

// Gestion des requêtes 404 (page non trouvée)
app.use((req, res) => {
  res.status(404).send("Aucune page trouvée correspondant à votre requête");
});

// Création et démarrage du serveur HTTPS
https.createServer(credentials, app).listen(443, () => {
  console.log("Server running on port 443");

  // Établissement de la connexion à la base de données MySQL
  db.connection();
});
