/**
 * Génération d'un sel (salt) aléatoire pour le hachage des mots de passe.
 * Cette fonction utilise un ensemble de caractères pour générer une chaîne aléatoire de la longueur spécifiée.
 *
 * @param {number} length - Longueur du sel à générer.
 * @returns {string} - Chaîne aléatoire de caractères.
 */
const generateSalt = function (length) {
  let result = "";

  // Ensemble de caractères utilisé pour la génération aléatoire
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;

  let counter = 0;

  // Boucle pour générer chaque caractère aléatoire
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }

  return result;
};

// TODO : Ajout de la fonction permettant le hashage

// Exportation de la fonction pour utilisation externe
module.exports = { generateSalt };
