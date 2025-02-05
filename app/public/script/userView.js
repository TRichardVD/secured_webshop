// ----[ Fonctions ]----

// Fonction pour récupérer la valeur d'un cookie par son nom
function getCookie(name) {
    // Ajout du égal pour éviter les confusions avec des noms similaires
    const cookieName = name + '=';
    // Découpage de la chaîne de cookies en tableau
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
        cookie = cookie.trim(); // Suppression des espaces
        if (cookie.startsWith(cookieName)) {
            return cookie.substring(cookieName.length);
        }
    }
    return null;
}

// ------[ MAIN ]------

const token = getCookie('token');
const id = window.location.pathname.split('/')[2];
let userInformations = undefined;

fetch(`/user/api/${id}`, {
    method: 'GET',
    headers: {
        token,
    },
})
    .then((response) => response.json())
    .then((response) => {
        console.log(response);
        userInformations = response.data;

        document.getElementsByTagName(
            'title'
        )[0].textContent = `Page de ${userInformations.username}`;
        document.getElementById(
            'h1Title'
        ).textContent = `Page de ${userInformations.username}`;

        // Création du tableau d'informations
        for (let [key, value] of Object.entries(userInformations)) {
            if (key !== 'passwordHashed' && key !== 'salt') {
                document.getElementById('InformationsUser').innerHTML += `
                    <tr>
                        <td>${key}</td>
                        <td>${value}</td>
                    </tr>
                `;
            }
        }

        document.getElementById('container').style = 'display: block';
        document.getElementById('Loading').style = 'display: none';
    })
    .catch((err) => {
        alert('Une erreur est survenue');
        console.error(err);
    });

// Retour à la page d'accueil
document.getElementById('ReturnToHome').addEventListener('click', () => {
    window.location.href = '/user';
});
