// Importation des modules nécessaires
const jwt = require('../helper/jwt');
const db = require('../model/database');
const dotenv = require('dotenv');
const hashage = require('../helper/hashage');

dotenv.config();

/**
 * Création d'un nouvel utilisateur.
 * Cette fonction utilise des informations fournies pour insérer un nouvel utilisateur dans la base de données.
 * Elle génère un sel aléatoire pour le hachage du mot de passe.
 *
 * @param {Object} params - Informations de l'utilisateur à créer.
 * @param {string} params.username - Nom d'utilisateur.
 * @param {string} params.password - Mot de passe.
 * @returns {Promise<number | undefined>} - ID de l'utilisateur créé ou `undefined` en cas d'échec.
 */
const createUser = async function ({ username, password }) {
    if (!username || !password) {
        console.error("Paramètres manquants pour la création d'utilisateur");
        return undefined;
    }

    // Hachage du mot de passe avec le sel
    const pswHashed = hashage.calculateHash(10, password);

    // Insertion des informations de l'utilisateur dans la base de données
    try {
        const result = await db.pool.query(
            `INSERT INTO ${db.tableUser} (username, passwordHashed) VALUES (?, ?)`,
            [username, pswHashed]
        );
        if (result.affectedRows === 0) {
            console.error("Erreur lors de la création de l'utilisateur");
            return undefined;
        }

        console.log('User created : ', result);
    } catch (err) {
        console.log('Error creating user: ', err);
        return undefined;
    }

    // Récupération des données de l'utilisateur tout juste créé

    try {
        const data = await getData({ username, passwordHashed: pswHashed });
        if (!data) {
            console.error('Erreur : Utilisateur créé introuvable');
            return undefined;
        }
        return data.id;
    } catch (err) {
        console.error(
            'Erreur lors de la récupération des données utilisateur : ',
            err
        );
        return undefined;
    }
};

/**
 * Récupération de données utilisateur selon les conditions fournies.
 * Cette fonction permet de récupérer des données avec ou sans filtrage sécurisé (en cachant les informations sensibles).
 * Si un token est fourni, elle vérifie les permissions et retourne les données appropriées.
 *
 * @param {Object} conditions - Conditions de recherche (clé-valeur).
 * @param {Object} [likeConditions=null] - Conditions LIKE pour la recherche.
 * @param {string} [token=undefined] - Token JWT pour vérifier les permissions.
 * @param {boolean} [secure=true] - Flag indiquant si les données doivent être retournées de manière sécurisée.
 * @returns {Promise<Object | undefined>} - Objet contenant les données utilisateur ou `undefined` si pas trouvé.
 */
const getData = async function (
    conditions,
    likeConditions = null,
    token = undefined,
    secure = true
) {
    // Préparation des clauses WHERE et LIKE pour la requête SQL
    const whereClause = [];
    const values = [];

    // Parcours des conditions pour construire la requête
    if (conditions) {
        for (const [key, value] of Object.entries(conditions)) {
            whereClause.push(`${key} = ?`);
            values.push(value);
        }
    }
    if (likeConditions) {
        for (const [key, value] of Object.entries(likeConditions)) {
            whereClause.push(`${key} LIKE ?`);
            values.push(value);
        }
    }

    // Construction de la requête SQL complète
    const query = `SELECT * FROM ${db.tableUser} ${
        whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : ''
    } LIMIT 10`;
    console.log(query, values);

    // Exécution de la requête SQL
    const [result] = await db.pool.query(query, values);

    // Traitement du résultat (filtrage sécurisé si nécessaire)
    if (result.length === 0) {
        return undefined;
    }

    if (!secure) {
        // Retourne tous les champs sans filtrage
        return result[0];
    }

    // Filtrage des informations sensibles
    const resultFiltered = result.map((element) => {
        const { passwordHashed, ...rest } = element;
        return rest;
    });

    try {
        if (!token) {
            // Retourne les données sans vérification de token
            return resultFiltered[0];
        }
        // Vérification du token et des permissions administrateur
        const tokenData = await jwt.verifyToken(token);
        const UserData = await getData({ id: tokenData.sub }, null, null, true);
        if (UserData.isAdmin === 1) {
            // Si administrateur, retourne toutes les données sans filtrage
            return result;
        }
        return resultFiltered[0];
    } catch (err) {
        return resultFiltered[0];
    }
};

module.exports = { createUser, getData };
