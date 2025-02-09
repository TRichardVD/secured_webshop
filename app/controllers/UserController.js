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
  token = undefined,
  secure = true
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

  // Revoye de la réponse
  if (result.length === 0) {
    return undefined;
  }

  if (!secure) {
    return result[0];
  }

  const resultFltered = result.map((element) => {
    const { passwordHashed, salt, ...rest } = element;
    return rest;
  });
  try {
    if (!token) {
      return resultFltered[0];
    }
    const tokenData = await jwt.verifyToken(token);
    const UserData = await getData({ id: tokenData.sub }, null, null, true);
    console.log("ICI");
    if (UserData.isAdmin === 1) {
      return result;
    }
    return resultFltered[0];
  } catch (err) {
    return resultFltered[0];
  }
};

module.exports = { createUser, getData };
