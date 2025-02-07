const jwt = require("../helper/jwt");
const db = require("../model/database");
const dotenv = require("dotenv");
const helper = require("../helper/helper");
const hashage = require("../helper/hashage");

dotenv.config();

const createUser = function ({ username, password }) {
    const salt = helper.generateSalt(10);
    const pswHashed = hashage.calculateHash(salt, password);
    // TODO: Ajout de vérification que le mot de passe respecte les normes
    db.pool
        .query(
            `INSERT INTO ${db.tableUser} (username, passwordHashed, salt) VALUES (?, ?, ?)`,
            [username, pswHashed, salt]
        )
        .then((result) => {
            console.log("User created : ", result);
        })
        .catch((err) => {
            console.log("Error creating user: ", err);
        });

    const data = getData({ username, passwordHashed: pswHashed, salt });
    if (!data) {
        console.error("Erreur : Utilisateur créé introuvable");
        return undefined;
    }
    return data.id;
};

const getData = async function (
    conditions,
    likeConditions = null,
    token = undefined
) {
    // Création des parties de la requête SQL
    const whereClause = [];
    const values = [];

    // Parcours des conditions fournies
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
        whereClause.length > 0 ? "WHERE " + whereClause.join(" AND ") : ""
    }`;
    console.log(query, values);

    // Exécution de la requête et filtrage de la reception
    const [result] = await db.pool.query(query, values);

    try {
        await jwt.verifyToken(token);

        return result;
    } catch (err) {
        return ({ username, id, isAdmin } = result);
    }
};

module.exports = { createUser, getData };
