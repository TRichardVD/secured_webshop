// Importation des modules nécessaires
const express = require("express");
const https = require("https");
const fs = require("fs");
const db = require("./model/database");
const path = require("path");
const SessionController = require("./controllers/SessionController");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

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

// Paramétrage de l'application Express
app.set("view engine", "ejs"); // Utilisation du moteur de rendu EJS
app.set("views", path.join(__dirname, "vue")); // Définition du dossier des vues

// Utilisation du middleware pour servir des fichiers statiques depuis le dossier "public"
app.use(express.static("public"));
// Utilisation du middleware pour parser les cookies de la requête
app.use(cookieParser());

// Middleware d'authentification
// Requiert l'authentification - redirige vers login si non connecté
const requireLogin = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect(
      "/login?message=Veuillez vous connecter pour accéder à cette page"
    );
  }

  try {
    const userData = await SessionController.isLogin(token);
    req.userData = userData;
    next();
  } catch (err) {
    console.log(err);
    return res.redirect(
      "/login?message=Veuillez vous connecter pour accéder à cette page"
    );
  }
};

// Redirige vers /user si déjà connecté
const redirectIfLoggedIn = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return next();
  }

  try {
    const userData = await SessionController.isLogin(token);
    return res.redirect("/user");
  } catch (err) {
    console.log(err);
    next();
  }
};

// Requiert l'authentification ET l'administration
const requireAdmin = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect(
      "/login?message=Veuillez vous connecter pour accéder à cette page"
    );
  }

  try {
    const userData = await SessionController.isLogin(token);
    if (userData.isAdmin !== 1) {
      return res.redirect(
        "/?message=Accès refusé - Vous n'êtes pas administrateur"
      );
    }
    req.userData = userData;
    next();
  } catch (err) {
    console.log(err);
    return res.redirect(
      "/login?message=Veuillez vous connecter pour accéder à cette page"
    );
  }
};

/**
 * Gestion de la page d'accueil. Vérifie si l'utilisateur est connecté.
 * Si connecté, affiche la page d'accueil, sinon redirige vers la page de connexion.
 */
app.get("/", requireLogin, (req, res) => {
  // L'utilisateur est connecté, le rediriger vers la page utilisateur
  return res.redirect("/user");
});

/**
 * Gestion de la page de connexion. Vérifie si l'utilisateur est déjà connecté.
 * Si connecté, redirige vers la page utilisateur, sinon affiche la page de connexion.
 */
app.get("/login", redirectIfLoggedIn, (req, res) => {
  // L'utilisateur n'est pas connecté, afficher la page de connexion
  return res.sendFile(path.join(__dirname, "./vue/login.html"));
});

/**
 * Route redirigeant l'utilisateur vers la page de connexion GitHub.
 */
app.get("/github-login", (req, res) => {
  const clientId = process.env.CLIENT_ID; // ID de l'application GitHub
  const redirectUri = "https://localhost/github-callback"; // URL de callback
  const scope = "read:user"; // Permissions demandées

  // Génération de l'URL de redirection vers GitHub
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scope}`;

  // Redirection vers GitHub
  return res.redirect(githubAuthUrl);
});

app.get("/github-callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.redirect("/?message=Code d'autorisation manquant");
  }

  try {
    // Échanger le code contre un token d'accès
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json", // Pour demander une réponse JSON
        },
        body: JSON.stringify({
          client_id: process.env.CLIENT_ID,
          client_secret: process.env.CLIENT_SECRET,
          code: code,
          redirect_uri:
            process.env.REDIRECT_URI || "https://localhost/github-callback",
        }),
      }
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(
        tokenData.error_description || "Erreur lors de l'échange du token."
      );
    }

    const accessToken = tokenData.access_token; // Token d'accès

    // Récupérer les informations utilisateur avec le token d'accès
    const userResponse = await fetch("https://api.github.com/user", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData = await userResponse.json();

    if (!userData || !userData.id || !userData.login) {
      throw new Error("Les données utilisateur GitHub sont incomplètes.");
    }

    // Récupérer les informations utiles de GitHub
    const provider = "github";
    const providerUserId = userData.id; // ID unique de l'utilisateur dans GitHub
    const username = userData.login; // Nom d'utilisateur GitHub
    const email = userData.email || null; // Peut être null si privé

    // Chiffrer le token d'accès
    const crypt = require("./helper/crypt");
    const encryptedAccessToken = crypt.encrypt(accessToken); // Chiffrement du token d'accès

    if (!encryptedAccessToken) {
      throw new Error("Erreur lors du chiffrement du token d'accès.");
    }

    // Vérifier si l'utilisateur OAuth existe déjà
    const existingOAuthAccount = await db.pool.query(
      "SELECT id, fkUser FROM t_oauth_accounts WHERE provider = ? AND provider_user_id = ?",
      [provider, providerUserId]
    );

    let userId;
    if (existingOAuthAccount[0].length > 0) {
      // L'utilisateur existe déjà
      userId = existingOAuthAccount[0][0].fkUser;

      // Mettre à jour le token d'accès
      await db.pool.query(
        `UPDATE ${db.tableOAuth} SET access_token = ? WHERE id = ?`,
        [encryptedAccessToken, existingOAuthAccount[0][0].id]
      );
    } else {
      // Créer un nouvel utilisateur
      const insertUserResult = await db.pool.query(
        "INSERT INTO t_users (username, email) VALUES (?, ?)",
        [username, email]
      );

      userId = insertUserResult[0].insertId;

      // Créer l'entrée OAuth associée
      await db.pool.query(
        "INSERT INTO t_oauth_accounts (fkUser, provider, provider_user_id, provider_email, access_token) VALUES (?, ?, ?, ?, ?)",
        [userId, provider, providerUserId, email, encryptedAccessToken]
      );
    }

    // Créer une session pour l'utilisateur (token jwt)
    const token = await SessionController.createSession(
      undefined,
      undefined,
      userId,
      false
    );

    // Stocker le token dans un cookie sécurisé
    res.cookie("token", token, {
      domain: "localhost",
      encode: String,
      secure: true,
      httpOnly: true,
    });

    // Rediriger l'utilisateur vers la page d'accueil
    res.redirect("/user?message=Connexion via GitHub réussie");
  } catch (error) {
    console.error("Erreur lors de l'authentification GitHub : ", error.message);
    res.redirect(
      "/login?message=Erreur lors de l'authentification GitHub: " +
        encodeURIComponent(error.message)
    );
  }
});

/**
 * Gestion de la page d'inscription. Vérifie si l'utilisateur est déjà connecté.
 * Si connecté, redirige vers la page utilisateur, sinon affiche la page d'inscription.
 */
app.get("/register", redirectIfLoggedIn, (req, res) => {
  // L'utilisateur n'est pas connecté, afficher la page d'inscription
  return res.sendFile(path.join(__dirname, "vue/register.html"));
});

// Utilisation des routes utilisateur
app.use("/user", require("./routes/User"));

/**
 * Gestion de la page d'administration. Vérifie si l'utilisateur est connecté et administrateur.
 * Si connecté et administrateur, affiche la page de dashboard d'admin, sinon renvoie une erreur 403.
 */
app.get("/admin", requireAdmin, (req, res) => {
  // L'utilisateur est admin, afficher la page admin
  return res
    .status(200)
    .sendFile(path.join(__dirname, "./vue/adminDashboard.html"));
});

// Gestion des requêtes 404 (page non trouvée)
app.use((req, res) => {
  res.status(404).send("Aucune page trouvée correspondant à votre requête");
});

// Création et démarrage du serveur HTTPS
https.createServer(credentials, app).listen(443, () => {
  console.log("Server running on port 443");

  try {
    // intialisation de dotenv
    dotenv.config();

    // Vérification du .env
    if (
      process.env.PRIVATE_KEY === "PRIVATE_KEY" ||
      process.env.POIVRE === "POIVRE" ||
      process.env.CLIENT_ID === "CLIENT_ID" ||
      process.env.CLIENT_SECRET === "CLIENT_SECRET" ||
      !(
        process.env.PRIVATE_KEY.length >= 8 &&
        process.env.POIVRE.length >= 8 &&
        process.env.CLIENT_ID.length >= 8 &&
        process.env.CLIENT_SECRET.length >= 8
      )
    ) {
      console.error(".env pas correctement complété");
      return;
    } else {
      console.log("Variables d'environnement correctement initialisées");
    }
  } catch (err) {
    console.error("Impossible d'accéder au .env", err);
    return;
  }

  // Établissement de la connexion à la base de données MySQL
  db.connection();
});
