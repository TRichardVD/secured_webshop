// TODO : Faire une fonction qui récupère les infos de l'utilisateur et affiche celle-ci

// ------[ HELPERS ]------

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

function eraseCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
}

// ------[ MAIN ]------

let userInformations = undefined;

const token = getCookie('token');
fetch('/user/api/getData', {
    method: 'GET',
    headers: {
        token,
    },
})
    .then((response) => response.json())
    .then((response) => {
        console.log(response);
        userInformations = response;

        document.getElementById('username').textContent = response.username;
        document.getElementById('container').style = 'display: block';
        document.getElementById('Loading').style = 'display: none';

        if (response.isAdmin === 1) {
            document.getElementById('AdminAcessButton').style = 'display:block';
        }
    })
    .catch((err) => {
        alert('Une erreur est survenue');
        console.error(err);
    });

// Deconnection
document.getElementById('DisconnectButton').addEventListener('click', () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        fetch('/user/api/deconnection', {
            method: 'POST',
            headers: {
                token,
            },
        })
            .then((result) => {
                console.log('Déconnection réussie');
                eraseCookie('token');
                window.location.href = '/login';
            })
            .catch((err) => {
                console.error(
                    "Une erreur s'est produite durant la déconnection",
                    err
                );
            });
    }
    return undefined;
});

// Redirection vers la page du profil
document.getElementById('AccessMyProfil').addEventListener('click', () => {
    window.location.href = `/user/${userInformations.id}`;
});
