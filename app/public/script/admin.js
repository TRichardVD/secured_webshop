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

function refreshUsers() {
    // Récupération de la valeur du champ de recherche
    const search = document.getElementById("search").value;

    // Envoi de la requête de recherche
    fetch(`/user/api/all?name=${search || ""}`, {
        method: "GET",
        headers: {
            token,
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

// ------[ MAIN ]------

const token = getCookie("token");

refreshUsers();

document.getElementById("searchButton").addEventListener("click", () => {
    refreshUsers();
});
