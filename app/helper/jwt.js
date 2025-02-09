// Importation des modules nécessaires
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

// Chargement des variables d'environnement
dotenv.config();

// Récupération de la clé privée stockée dans une variable d'environnement
const privateKey = process.env.PRIVATE_KEY;

// Configuration pour la génération des tokens JWT
const settings = {
  algorithm: "HS256", // Algorithme d'encryption utilisé
};

/**
 * Génération d'un token JWT à partir des données fournies.
 * Cette fonction utilise la clé privée pour signer le token.
 *
 * @param {Object} data - Données à encoder dans le token JWT.
 * @returns {Promise<string>} - Promesse résolue avec le token JWT généré ou rejetée avec une erreur.
 */
const createToken = function (data) {
  return new Promise((resolve, reject) => {
    // Génération du token JWT
    jwt.sign(data, process.env.PRIVATE_KEY, settings, (err, token) => {
      if (err) {
        // En cas d'erreur lors de la génération du token
        reject(err);
      } else {
        // Résolution avec le token généré
        resolve(token);
      }
    });
  });
};

/**
 * Vérification d'un token JWT.
 * Cette fonction vérifie l'intégrité et la validité du token en utilisant la clé privée.
 *
 * @param {string} token - Token JWT à vérifier.
 * @returns {Promise<Object>} - Promesse résolue avec les données décodées ou rejetée avec une erreur.
 */
const verifyToken = function (token) {
  return new Promise((resolve, reject) => {
    console.log("Dans verifyToken TOKEN : ", token);
    // Vérification du token JWT
    jwt.verify(token, privateKey, (err, decoded) => {
      if (err) {
        // En cas d'erreur, rejet avec l'erreur
        reject(err);
      } else {
        // Résolution avec les données décodées
        resolve(decoded);
      }
    });
  });
};

// Exportation des fonctions pour utilisation externe
module.exports = { createToken, verifyToken };
