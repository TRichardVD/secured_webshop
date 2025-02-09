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
    // Suppression des espaces autour de chaque cookie
    cookie = cookie.trim();
    if (cookie.startsWith(cookieName)) {
      // Retourne la valeur du cookie en supprimant le nom et le "="
      return cookie.substring(cookieName.length);
    }
  }
  return null;
}

// Section principale

/**
 * Rafraîchissement de la liste des utilisateurs en fonction du champ de recherche.
 * Cette fonction envoie une requête GET pour obtenir la liste mise à jour des utilisateurs filtrés par le champ de recherche.
 */
function refreshUsers() {
  // Récupération de la valeur du champ de recherche
  const search = document.getElementById("search").value;

  // Envoi de la requête de recherche
  fetch(`/user/api/all?name=${search || ""}`, {
    method: "GET",
    headers: {
      token: getCookie("token"), // Récupération dynamique du token
    },
  })
    .then((response) => response.json())
    .then((response) => {
      console.log(response);
      // Suppression des anciens résultats
      const results = document.getElementById("users");
      results.innerHTML = "";

      // Création des éléments de la liste
      for (let user of response.data) {
        document.getElementById("users").innerHTML += `
          <tr>
            <td>${user.id}</td>
            <td>${user.username}</td>
          </tr>`;
      }
    })
    .catch((err) => {
      alert("Une erreur est survenue");
      console.error(err);
    });
}

// Section principale

// Récupération du token depuis les cookies
const token = getCookie("token");

// Premier appel pour charger la liste initiale
refreshUsers();

// Ajout d'un événement pour le bouton "Rechercher"
document.getElementById("searchButton").addEventListener("click", () => {
  refreshUsers();
});

// Ajout d'un événement pour les presses de touches
document.getElementById("search").addEventListener("keydown", (e) => {
  // Vérification si la touche Entrée a été pressée (code pour appeler la fonction refreshUsers)
  if (e.key === "Enter") {
    refreshUsers();
  }
});
