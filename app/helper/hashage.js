// Importation de la fonction scryptSync et timingSafeEqual du module crypto
const { scryptSync, timingSafeEqual } = require('node:crypto');

/**
 * Fonction pour calculer le hachage d'une donnée avec un sel.
 * Utilise l'algorithme scrypt, qui est recommandé par OWASP pour son coût élevé en ressources,
 * ce qui ralentit les attaques par force brute. ( J'avais de base choisi sha256 mais il est déconseillé par OWASP pour le stockage de mot de passe car trop rapide ce qui le rend vulnérable aux attaques par force brute)
 *
 * @param {string} salt - Le sel aléatoire généré pour chaque utilisateur.
 * @param {string} data - Le mot de passe à hacher.
 * @returns {string} Le hachage sous forme hexadécimale.
 */
const calculateHash = (salt, data) => {
    // Définition de la longueur du hachage en octets
    const keyLength = 64;

    // Calcul du hachage en utilisant scrypt
    return scryptSync(data, salt, keyLength).toString('hex');
};

/**
 * Fonction pour comparer un hachage calculé avec un hachage existant.
 * Utilise timingSafeEqual pour éviter les attaques temporelles.
 *
 * @param {string} salt - Le sel utilisé pour le hachage initial.
 * @param {string} data - Les données à hacher (généralement un mot de passe).
 * @param {string} hash - Le hachage existant à comparer.
 * @returns {boolean} True si les hachages sont identiques, false sinon.
 */
const compareHash = (salt, data, hash) => {
    // Conversion du hachage existant en buffer
    const hashedBuffer = Buffer.from(hash, 'hex');

    // Calcul du hachage actuel pour comparaison
    const currentBuffer = Buffer.from(calculateHash(salt, data), 'hex');

    // Comparaison sécurisée des hachages
    return timingSafeEqual(hashedBuffer, currentBuffer);
};

// Exportation des fonctions pour utilisation dans d'autres modules
module.exports = { calculateHash, compareHash };
