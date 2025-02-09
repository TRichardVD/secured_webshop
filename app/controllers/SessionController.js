// Importation des modules nécessaires
const jwt = require("../helper/jwt");
const db = require("../model/database");
const dotenv = require("dotenv");
const helper = require("../helper/helper");
const UserController = require("./UserController");
const hashage = require("../helper/hashage");

dotenv.config();

/**
 * Création d'une nouvelle session pour un utilisateur.
 * Cette fonction vérifie les identifiants, génère un token JWT et crée une entrée dans la base de données si la session est valide.
 *
 * @param {string} username - Le nom d'utilisateur.
 * @param {string} password - Le mot de passe de l'utilisateur.
 * @returns {Promise<string | undefined>} - Le token JWT généré ou `undefined` en cas d'échec.
 */
const createSession = async function (username, password) {
  // Vérification des paramètres de connexion et récupération des données manquantes
  const data = await UserController.getData({ username }, null, null, false);

  if (!data) {
    // Rien à faire si utilisateur non trouvé
    return;
  }

  // Vérification du mot de passe
  if (!hashage.compareHash(data.salt, password, data.passwordHashed)) {
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
      console.log("Dans isLogin TOKEN : ", token);
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
      if (result[0].length === 1) {
        // Si on trouve une entrée valide

        // Récupération des données de l'utilisateur
        const user = await UserController.getData(
          {
            id: result[0][0].fkUser,
          },
          null,
          null,
          secure
        );
        console.log("User : ", user);
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

module.exports = { createSession, isLogin, deleteSession };
