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

/**
 * Efface un cookie existant.
 *
 * @param {string} name - Nom du cookie à effacer.
 */
function eraseCookie(name) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/";
}

// Section principale

// Variable pour stocker les informations de l'utilisateur
let userInformations = undefined;

// Récupération du token depuis les cookies
const token = getCookie("token");

// Récupération des informations de l'utilisateur via une requête serveur
fetch("/user/api/getData", {
  method: "GET",
  headers: {
    token,
  },
})
  .then((response) => response.json())
  .then((response) => {
    console.log(response);
    userInformations = response;

    // Affichage des informations de l'utilisateur
    document.getElementById("username").textContent = response.username;
    document.getElementById("container").style = "display: block";
    document.getElementById("Loading").style = "display: none";

    // Affichage du bouton d'accès administrateur si nécessaire
    if (response.isAdmin === 1) {
      document.getElementById("AdminAcessButton").style = "display: block";
    }
  })
  .catch((err) => {
    alert("Une erreur est survenue");
    console.error(err);
  });

// Gestion de la déconnexion

document.getElementById("DisconnectButton").addEventListener("click", () => {
  if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
    fetch("/user/api/deconnection", {
      method: "POST",
      headers: {
        token,
      },
    })
      .then((result) => {
        console.log("Déconnection réussie");
        eraseCookie("token"); // Suppression du cookie de session
        window.location.href = "/login"; // Redirection vers la page de connexion
      })
      .catch((err) => {
        console.error("Une erreur s'est produite durant la déconnection", err);
      });
  }
  return undefined;
});

// Gestion des redirections vers d'autres pages

// Redirection vers la page du profil de l'utilisateur
document.getElementById("AccessMyProfil").addEventListener("click", () => {
  window.location.href = `/user/${userInformations.id}`;
});

// Redirection vers la page d'administration
document.getElementById("AdminAcessButton").addEventListener("click", () => {
  window.location.href = `/admin`;
});
