// Section des fonctions d'assistance

/**
 * Récupère la valeur d'un cookie par son nom.
 *
 * @param {string} name - Nom du cookie à récupérer.
 * @returns {string|null} - Valeur du cookie si trouvé, null sinon.
 */
function getCookie(name) {
  // Ajout d'un "=" pour éviter les confusions avec des noms similaires
  const cookieName = name + "=";
  // Découpage de la chaîne de cookies en tableau
  const cookies = document.cookie.split(";");

  for (let cookie of cookies) {
    cookie = cookie.trim(); // Suppression des espaces
    if (cookie.startsWith(cookieName)) {
      return cookie.substring(cookieName.length);
    }
  }
  return null;
}

// Section principale

// Récupération du token depuis les cookies
const token = getCookie("token");
// Extraction de l'ID de l'utilisateur depuis l'URL
const id = window.location.pathname.split("/")[2];
let userInformations = undefined;

// Envoi d'une requête pour obtenir les informations de l'utilisateur
fetch(`/user/api/${id}`, {
  method: "GET",
  headers: {
    token, // Utilisation du token pour l'authentification
  },
})
  .then((response) => response.json())
  .then((response) => {
    console.log(response);
    userInformations = response.data;

    // Mise à jour du titre de la page
    document.getElementsByTagName(
      "title"
    )[0].textContent = `Page de ${userInformations.username}`;
    document.getElementById(
      "h1Title"
    ).textContent = `Page de ${userInformations.username}`;

    // Création du tableau d'informations utilisateur
    for (let [key, value] of Object.entries(userInformations)) {
      if (key !== "passwordHashed" && key !== "salt") {
        document.getElementById("InformationsUser").innerHTML += `
          <tr>
            <td>${key}</td>
            <td>${value}</td>
          </tr>
        `;
      }
    }

    // Affichage du contenu et masquage du chargement
    document.getElementById("container").style = "display: block";
    document.getElementById("Loading").style = "display: none";
  })
  .catch((err) => {
    alert("Une erreur est survenue");
    console.error(err);
  });

// Gestion du clic sur le bouton de retour à la page d'accueil
document.getElementById("ReturnToHome").addEventListener("click", () => {
  window.location.href = "/user";
});
