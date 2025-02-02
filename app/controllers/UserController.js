const jwt = require('jsonwebtoken');
const db = require('../model/database');
const dotenv = require('dotenv');
const helper = require('../helper');

dotenv.config();

const createUser = function ({ username, password }) {
    const salt = helper.generateSalt(10);

    // TODO: Ajout de vérification que le mot de passe respecte les normes
    db.pool
        .query(
            `INSERT INTO ${db.tableUser} (username, passwordHashed, salt) VALUES (?, ?, ?)`,
            [username, password, salt]
        )
        .then((result) => {
            console.log('User created : ', result);
        })
        .catch((err) => {
            console.log('Error creating user: ', err);
        });

    const data = getData({ username, passwordHashed: password, salt });
    if (!data) {
        console.error('Erreur : Utilisateur créé introuvable');
        return undefined;
    }
    return data.id;
};

const getData = async function (conditions) {
    // Création des parties de la requête SQL
    const whereClause = [];
    const values = [];

    // Parcours des conditions fournies
    for (const [key, value] of Object.entries(conditions)) {
        whereClause.push(`${key} = ?`);
        values.push(value);
    }

    // Construction de la requête SQL complète
    const query = `SELECT * FROM ${db.tableUser} ${
        whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : ''
    }`;

    // Exécution de la requête et filtrage de la reception
    // TODO : Problème ci-dessous a completer
    const [result] = await db.pool.query(query, values);

    console.log('result : ', result);
    return result;
};

const getPublicData = function (conditions) {
    // Création des parties de la requête SQL
    const whereClause = [];
    const values = [];

    // Parcours des conditions fournies
    for (const [key, value] of Object.entries(conditions)) {
        whereClause.push(`${key} = ?`);
        values.push(value);
    }

    // Construction de la requête SQL complète
    const query = `SELECT * FROM ${db.tableUser} ${
        whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : ''
    }`;

    // Exécution de la requête et filtrage de la reception
    const result = ({ username, id } = db.pool.query(query, values, (err) => {
        if (err) {
            console.log(err);
        }
    }));

    return result;
};

module.exports = { createUser, getData, getPublicData };
