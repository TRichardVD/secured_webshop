// TODO : Faire une fonction qui récupère les infos de l'utilisateur et affiche celle-ci

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
const token = getCookie("token");
fetch("/user/api/getData", {
  method: "GET",
  headers: {
    token,
  },
})
  .then((response) => response.json())
  .then((response) => {
    console.log(response);
    document.getElementById("username").textContent = response.data.username;
    document.getElementById("container").style = "display: block";
    document.getElementById("Loading").style = "display: none";

    if (response.data.isAdmin === 1) {
      document.getElementById("AdminAcessButton").style = "display:block";
    }
  })
  .catch((err) => {
    alert("Une erreur est survenue");
    console.error(err);
  });
