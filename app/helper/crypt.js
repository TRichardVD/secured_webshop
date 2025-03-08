const crypto = require("crypto");

// Fonction pour dériver une clé de 32 octets (256 bits) à partir d'une clé d'entrée
const deriveKey = (inputKey) => {
  // Utiliser SHA-256 pour obtenir une clé de la bonne taille
  return crypto.createHash("sha256").update(String(inputKey)).digest();
};

const encrypt = (text) => {
  try {
    if (!text) {
      return null; // Retourne null si le texte est vide
    }
    const inputKey = process.env.ENCRYPTION_KEY;
    if (!inputKey) {
      throw new Error("La clé de chiffrement n'est pas définie");
    }

    // Dériver une clé de taille fixe (32 octets)
    const key = deriveKey(inputKey);

    const iv = crypto.randomBytes(16); // Initialisation du vecteur d'initialisation
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv); // Création du cipher avec la clé dérivée
    let encrypted = cipher.update(text, "utf8", "hex"); // Chiffrement du texte
    encrypted += cipher.final("hex"); // Finalisation du chiffrement
    return iv.toString("hex") + ":" + encrypted; // Retourne le vecteur d'initialisation et le texte chiffré
  } catch (err) {
    console.error("Erreur lors du chiffrement : ", err);
    return null; // Retourne null en cas d'erreur
  }
};

const decrypt = (text) => {
  try {
    if (!text) {
      return null; // Retourne null si le texte est vide
    }
    const inputKey = process.env.ENCRYPTION_KEY;
    if (!inputKey) {
      throw new Error("La clé de chiffrement n'est pas définie");
    }

    // Utiliser la même fonction de dérivation de clé pour le déchiffrement
    const key = deriveKey(inputKey);

    const textParts = text.split(":"); // Séparation du vecteur d'initialisation et du texte chiffré
    const iv = Buffer.from(textParts.shift(), "hex"); // Conversion du vecteur d'initialisation en buffer
    const encryptedText = Buffer.from(textParts.join(":"), "hex"); // Conversion du texte chiffré en buffer
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv); // Création du decipher
    let decrypted = decipher.update(encryptedText, "hex", "utf8"); // Déchiffrement du texte
    decrypted += decipher.final("utf8"); // Finalisation du déchiffrement
    return decrypted; // Retourne le texte déchiffré
  } catch (err) {
    console.error("Erreur lors du déchiffrement : ", err);
    return null; // Retourne null en cas d'erreur
  }
};

module.exports = {
  encrypt,
  decrypt,
};

/* Notes :
Buffer.from() sert à créer un buffer à partir d'une chaîne de caractères ou d'un tableau d'octets. Un buffer est un espace mémoire brut qui peut contenir des données binaires.

*/
