// Importation du module MySQL avec prise en charge des promesses
const mysql = require("mysql2/promise");

// Configuration de la connexion à la base de données
const settings = {
  host: "localhost", // Hôte de la base de données
  port: 6033, // Port utilisé pour la connexion
  user: "root", // Nom d'utilisateur pour l'accès à la base de données
  password: "root", // Mot de passe pour l'accès à la base de données
  database: "db_webstore", // Nom de la base de données à utiliser
};

// Nomenclature des tables
const tableUser = "t_users"; // Table des utilisateurs
const tableSession = "t_sessions"; // Table des sessions
const tableOAuth = "t_oauth_accounts"; // Table des informations OAuth

// Création d'un pool de connexions pour gérer plusieurs requêtes simultanément
const pool = mysql.createPool(settings);

/**
 * Obtention d'une connexion à la base de données via le pool.
 *
 * @returns {Promise<PoolConnection>} Promesse résolue avec une connexion active
 * ou rejetée en cas d'erreur.
 */
const getConnection = function () {
  return pool
    .getConnection()
    .then((connection) => {
      console.log("Database connected");
      return connection; // Retourne la connexion pour utilisation ultérieure
    })
    .catch((err) => {
      console.error("Error connecting to DB:", err);
      throw err; // Relance l'erreur pour gestion externe
    });
};

// Exportation des éléments importants pour un usage externe
module.exports = {
  pool,
  connection: getConnection,
  tableUser,
  tableSession,
  tableOAuth,
};
