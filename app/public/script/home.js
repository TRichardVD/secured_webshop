// Section des fonctions d'assistance

/**
 * Efface un cookie existant.
 *
 * @param {string} name - Nom du cookie à effacer.
 */
function eraseCookie(name) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/";
}

// Section principale

// Afficher le bouton d'administration si l'utilisateur est administrateur
if (Number(window.user.isAdmin) === 1) {
  document.getElementById("AdminAcessButton").style.display = "block";
}

// Gestion de la déconnexion

document.getElementById("DisconnectButton").addEventListener("click", () => {
  if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
    fetch("/user/api/deconnection", {
      method: "POST",
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
  window.location.href = `/user/${window.user.id}`;
});

// Redirection vers la page d'administration
document.getElementById("AdminAcessButton").addEventListener("click", () => {
  window.location.href = `/admin`;
});
