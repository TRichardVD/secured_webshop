const bcrypt = require('bcrypt');

/**
 * Chaîne de caractères utilisée comme poivre pour renforcer la sécurité des hachages.
 * @type {string}
 */
const poivre = process.env.POIVRE;

/**
 * Calcule l'hachage d'une donnée en utilisant bcrypt.
 *
 * @param {number} sizeSalt Taille du sel à utiliser pour l'hachage.
 * @param {string} data Donnée à hacher.
 * @returns {string} L'hachage de la donnée.
 */
const calculateHash = (sizeSalt, data) => {
    return bcrypt.hashSync(poivre + data, Number(sizeSalt));
};

/**
 * Compare une donnée avec un hachage existant.
 *
 * @param {string} data Donnée à comparer.
 * @param {string} hash Hachage à comparer avec la donnée.
 * @returns {boolean} True si la donnée correspond à l'hachage, false sinon.
 */
const compareHash = (data, hash) => {
    return bcrypt.compareSync(poivre + data, hash);
};

/**
 * Exporte les fonctions pour calculer et comparer des hachages.
 */
module.exports = { calculateHash, compareHash };
