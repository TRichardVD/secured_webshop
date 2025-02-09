/**
 * Valide et nettoie une entrée utilisateur pour éviter les attaques XSS et SQLi.
 * Cette fonction vérifie la conformité de l'entrée à certaines règles de sécurité,
 * échappe les caractères dangereux et retourne la chaîne sécurisée si valide.
 *
 * @param {*} input - Entrée utilisateur à valider.
 * @param {number} maxLength - Longueur maximale autorisée pour l'entrée.
 * @returns {Promise<string>} - Promesse résolue avec l'entrée nettoyée ou rejetée avec une erreur.
 */
const secureInputValidation = function (input, maxLength) {
  return new Promise((resolve, reject) => {
    // Vérification que l'entrée n'est pas nulle ou indéfinie
    if (input === undefined || input === null) {
      reject("Entrée invalide : valeur nulle");
      return;
    }

    // Normalisation et conversion en chaîne
    const inputStr = String(input).normalize("NFC");

    // Détection des motifs XSS/SQLi combinés
    const xssPattern =
      /(<|>|&lt;|&gt;|javascript:|on\w+\s*=|\/\*|\*\/|--|;|%0A|%0D|[\u00A0-\uFFFF]'|\\x[0-9a-fA-F]{2})/gi;
    const sqlPattern =
      /(union\s+select|insert\s+into|drop\s+table|exec(\s|\()|alter\s+table)/gi;

    const xssMatches = inputStr.match(xssPattern) || [];
    const sqlMatches = inputStr.match(sqlPattern) || [];
    const threats = [...new Set([...xssMatches, ...sqlMatches])];

    // Rejet si des menaces XSS ou SQLi sont détectées
    if (threats.length > 0) {
      reject(`Menace détectée : ${threats.map((t) => `"${t}"`).join(", ")}`);
      return;
    }

    // Whitelist contextuelle (caractères autorisés)
    const allowedChars =
      /^[\p{L}\d\s\-@.,!?;:()€$°&=+/*%#{}[\]'"`~§èéçàùäöüß]*$/u;
    if (!allowedChars.test(inputStr)) {
      reject("Caractères non autorisés détectés");
      return;
    }

    // Validation de la longueur
    if (inputStr.length > maxLength) {
      reject(
        `Dépassement de taille de ${
          maxLength - inputStr.length
        } (max ${maxLength} caractères)`
      );
      return;
    }

    // Échappement contextuel final
    const sanitized = inputStr
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");

    // Résolution avec l'entrée nettoyée
    resolve(sanitized);
  });
};

// Exportation de la fonction pour utilisation externe
module.exports = { secureInputValidation };
