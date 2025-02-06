// ------[ HELPERS ]------

// Fonction pour récupérer la valeur d'un cookie par son nom
function getCookie(name) {
  // Ajout du égal pour éviter les confusions avec des noms similaires
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

// ------[ MAIN ]------

const token = getCookie("token");

document.getElementById("searchButton").addEventListener("click", () => {
  // Récupération de la valeur du champ de recherche
  const search = document.getElementById("search").value;

  // Envoi de la requête de recherche
  fetch(`/user?name=${search}`, {
    method: "GET",
    headers: {
      token,
    },
  })
    .then((response) => response.json())
    .then((response) => {
      // Suppression des anciens résultats
      const results = document.getElementById("users");
      results.innerHTML = "";

      // Création des éléments de la liste
      for (let user of response) {
        const userElement = document.createElement("li");
        userElement.textContent = user.username;
        results.appendChild(userElement);
      }
    })
    .catch((err) => {
      alert("Une erreur est survenue");
      console.error(err);
    });
});
