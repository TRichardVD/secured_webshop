// Importation des modules nécessaires
const jwt = require("../helper/jwt");
const db = require("../model/database");
const dotenv = require("dotenv");
const UserController = require("./UserController");
const hashage = require("../helper/hashage");
const database = require("../model/database");

dotenv.config();

/**
 * Création d'une nouvelle session pour un utilisateur.
 * Cette fonction vérifie les identifiants, génère un token JWT et crée une entrée dans la base de données si la session est valide.
 *
 * @param {string} username - Le nom d'utilisateur.
 * @param {string} password - Le mot de passe de l'utilisateur.
 * @returns {Promise<string | undefined>} - Le token JWT généré ou `undefined` en cas d'échec.
 */
const createSession = async function (
  username = undefined,
  password = undefined,
  userId = undefined,
  secure = true
) {
  // Vérification des paramètres de connexion et récupération des données manquantes
  let data = undefined;
  if (userId) {
    data = await UserController.getData({ id: userId }, null, null, false);
  } else if (username) {
    data = await UserController.getData(
      { username: username },
      null,
      null,
      false
    );
  } else {
    console.error("Paramètres de connexion manquants");
    return;
  }

  if (!data) {
    // Rien à faire si utilisateur non trouvé
    return;
  }

  // Vérification du mot de passe
  if (secure && !hashage.compareHash(password, data.passwordHashed)) {
    console.error("Mot de passe incorrect");
    return;
  }

  // Informations pour le token
  const dataToken = {
    sub: data.id, // ID de l'utilisateur
    userCreation: data.created_at, // Date de création du compte
    admin: data.isAdmin === 1, // Flag administrateur
    iat: Math.floor(new Date() / 1000), // Date d'émission
    exp: Math.floor(new Date() / 1000) + 60 * 60, // Date d'expiration (1 heure après emission)
  };

  const iatStr = new Date(dataToken.iat * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  const expStr = new Date(dataToken.exp * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  let sessionCreated = false; // Pour gérer la suppression en cas d'échec

  try {
    // Ajout de la session à la base de données
    await db.pool.query(
      `INSERT INTO ${db.tableSession} (fkUser, created_at, expires_at) VALUES (?, ?, ?)`,
      [data.id, iatStr, expStr]
    );
    sessionCreated = true;

    // Récupération de l'ID du token créé
    const Token = await db.pool.query(
      `SELECT id FROM ${db.tableSession} WHERE fkUser = ? AND created_at = ? AND expires_at = ? ORDER BY created_at DESC LIMIT 1`,
      [data.id, iatStr, expStr]
    );

    if (!Token) {
      throw new Error("Impossible de récupérer l'ID de session");
    }
    const idToken = Token[0][0].id;

    // Génération du token JWT avec le JTI (ID de session)
    dataToken.jti = idToken;

    const token = await jwt.createToken(dataToken);

    console.log("Nouveau token ", token);

    return token;
  } catch (err) {
    console.error("Erreur lors de la création de session : ", err);

    if (sessionCreated) {
      try {
        // Suppression de la session si elle a été créée
        await db.pool.query(
          `DELETE FROM ${db.tableSession} 
           WHERE fkUser = ? AND created_at = ? AND expires_at = ?`,
          [data.id, iatStr, expStr]
        );
      } catch (deleteErr) {
        console.error("Erreur lors de la suppression de session : ", deleteErr);
      }
    }

    return undefined;
  }
};

/**
 * Vérifie si un utilisateur est connecté via le token fourni.
 * Cette fonction vérifie la validité du token JWT et s'il correspond à une session active dans la base de données.
 *
 * @param {string} token - Le token JWT à vérifier.
 * @param {boolean} secure - Flag indiquant si une recherche sécurisée doit être effectuée pour récupérer les données utilisateur.
 * @returns {Promise<Object>} - Résolution avec les informations utilisateur ou rejet avec une erreur.
 */
const isLogin = function (token, secure = true) {
  return new Promise(async (resolve, reject) => {
    if (!token) {
      // Aucun token fourni, on rejette avec une erreur
      reject("Aucun token");
      return;
    }

    let decoded = undefined;

    try {
      decoded = await jwt.verifyToken(token);
    } catch (error) {
      console.error("Erreur de vérification du token : ", error.message);
      reject("Token Invalide");
      return;
    }

    try {
      // Vérifie si le token correspond à une session active dans la base de données
      const result = await db.pool.query(
        `SELECT * FROM ${db.tableSession} WHERE id = ?`,
        [decoded.jti]
      );
      console.log(result);
      // Si on trouve une entrée valide
      if (result[0].length === 1) {
        // Récupération des données de l'utilisateur
        const user = await UserController.getData(
          {
            id: result[0][0].fkUser,
          },
          null,
          null,
          false
        );
        console.log("User : ", user);

        // Si c'est une connection via Github
        if (!user.passwordHashed || user.passwordHashed.length < 3) {
          // Récupération du token de connection via Github
          const [oauthData] = await database.pool.query(
            `SELECT * FROM ${database.tableOAuth} WHERE fkUser = ?`,
            [user.id]
          );

          if (!oauthData || oauthData.length !== 1) {
            reject("Erreur données pour la session oauth invalide");
            console.error(
              `Erreur pour l'utilisateur ${user.id}, ${oauthData.length} session(s) OAUTH ont été trouvée(s)`
            );
            return;
          }

          // Déchiffrer access token
          const crypt = require("../helper/crypt");
          const decryptedAccessToken = crypt.decrypt(oauthData[0].access_token);

          if (!decryptedAccessToken) {
            reject("Erreur lors du déchiffrement du token d'accès");
            console.error("Erreur lors du déchiffrement du token d'accès");
            return;
          }

          try {
            console.log("Tentative de requete chez github");
            const userResponse = await fetch("https://api.github.com/user", {
              method: "GET",
              headers: {
                Authorization: `Bearer ${decryptedAccessToken}`,
              },
            });
            const userGithubData = await userResponse.json();

            if (!userGithubData.id || userResponse.status !== 200) {
              console.error(
                "Github à retourner une erreur : ",
                userResponse.statusText
              );
              reject("Github à retourner une erreur");
              return;
            }
            console.log("requete réusiie : l'utilisateur existe");
          } catch (err) {
            reject(
              "Erreur lors de la requete chez Github. Veuillez réessayer plus tard !"
            );
            console.error("Erreur lors de la requete chez github : ", err);
          }
        }

        // On résout avec les informations utilisateur et l'ID du token
        resolve({ ...user, tokenId: decoded.jti });
        return;
      } else {
        reject("Token non trouvé dans la base de données");
        return;
      }
    } catch (err) {
      console.error("Erreur dans la vérification du token dans la DB : " + err);
      // On rejette avec une erreur de base de données
      reject("Erreur base de données");
      return;
    }
  });
};

const isLoginMiddleware = async function (req, res, next) {
  const token =
    req.cookies.token ||
    req.headers["authorization"]?.split(" ")[1] ||
    req.query.token ||
    req.body.token;
  if (!token) {
    return res.status(401).json({ message: "Token manquant" });
  }

  try {
    const userData = await isLogin(token);
    req.userData = userData;
    next();
  } catch (error) {
    console.error(
      "Erreur dans le middleware de vérification du token : ",
      error
    );
    return res.redirect("/login");
  }
};

// Requiert l'authentification - redirige vers login si non connecté
const requireLogin = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect(
      "/login?message=Veuillez vous connecter pour accéder à cette page"
    );
  }

  try {
    const userData = await isLogin(token);
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
    const userData = await isLogin(token);
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
    const userData = await isLogin(token);
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
 * Suppression d'une session.
 * Cette fonction supprime la session associée à un token JWT.
 *
 * @param {string} token - Le token JWT pour lequel supprimer la session.
 * @returns {Promise<string | undefined>} - Promesse résolue avec un message de succès ou rejetée avec une erreur.
 */
const deleteSession = function (token) {
  return new Promise(async (resolve, reject) => {
    // Vérification du login pour obtenir les données utilisateur
    let userData = undefined;
    try {
      userData = await isLogin(token);

      // Suppression de la session depuis la base de données
      const resultQuery = await db.pool.query(
        `DELETE FROM ${db.tableSession} WHERE id=?`,
        [userData.tokenId]
      );
      if (resultQuery[0].affectedRows !== 1) {
        throw new Error("Erreur lors de la suppression de la session");
      }
      resolve("Session supprimée");
    } catch (error) {
      console.error("Erreur lors de la suppression de la session : ", error);
      reject("Erreur lors de la suppression de la session");
    }
  });
};

module.exports = {
  createSession,
  isLogin,
  deleteSession,
  isLoginMiddleware,
  requireLogin,
  redirectIfLoggedIn,
  requireAdmin,
};
