// Importation des modules nécessaires
const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController.js");
const SessionController = require("../controllers/SessionController.js");
const secureEntry = require("../helper/secureEntry.js");
const path = require("path");

// Middleware pour parser les données POST
router.use(express.urlencoded({ extended: true }));

/**
 * Page d'accueil. Vérifie si l'utilisateur est connecté avant d'afficher la page.
 */
router.get("/", async (req, res) => {
    let userData = undefined;
    try {
        userData = await SessionController.isLogin(req.cookies.token);
        return res.render("home", {
            username: userData.username,
            id: userData.id,
            isAdmin: userData.isAdmin,
        });
    } catch (err) {
        console.log("renvoie /login", err);
        // Redirection vers la page de connexion si non connecté
        return res.redirect("/login");
    }
});

/**
 * Gestion de la création d'un nouvel utilisateur.
 * Cette fonction vérifie la sécurité des données d'entrée puis crée l'utilisateur.
 */
router.post("/api/create", async (req, res) => {
    const { username, password } = req.body;
    console.log("Création d'utilisateur : ", username, password);
    if (!username || !password) {
        return res
            .status(400)
            .send("Paramètres manquants pour la création d'utilisateur");
    }

    let secureUsername = undefined;
    let securePassword = undefined;

    try {
        // Vérification de sécurité sur le nom d'utilisateur
        secureUsername = await secureEntry.secureInputValidation(username);
    } catch (err) {
        return res.status(400).send("Username invalide : " + err);
    }
    try {
        // Vérification de sécurité sur le mot de passe
        securePassword = await secureEntry.secureInputValidation(password);
    } catch (err) {
        return res.status(400).send("Password invalide : " + err);
    }

    // Création de l'utilisateur avec les données sécurisées
    UserController.createUser({
        username: secureUsername,
        password: securePassword,
    });

    // Redirection vers la page de connexion après création
    return res.redirect("/login?username=" + secureUsername);
});

/**
 * Gestion de la connexion. Vérifie les informations d'identification et créé un token.
 */
router.post("/api/login", async function (req, res) {
    const { username, password } = req.body;

    let secureUsername = undefined;
    let securePassword = undefined;

    try {
        // Vérification de sécurité sur le nom d'utilisateur
        secureUsername = await secureEntry.secureInputValidation(username);
    } catch (err) {
        return res.status(400).send("Username invalide : " + err);
    }
    try {
        // Vérification de sécurité sur le mot de passe
        securePassword = await secureEntry.secureInputValidation(password);
    } catch (err) {
        return res.status(400).send("Password invalide : " + err);
    }

    // Vérifier les informations d'identification
    try {
    } catch (err) {
        return res.status(400).send("Erreur lors de la connexion : " + err);
    }

    try {
        // Création d'une session si les informations sont valides
        const token = await SessionController.createSession(
            secureUsername,
            securePassword
        );

        if (!token) {
            return res.redirect(`/login?username=${username}`);
        }

        // Enregistrement du token sous forme de cookie
        return res
            .cookie("token", token, {
                domain: "localhost",
                encode: String,
                secure: true,
                httpOnly: true,
            })
            .redirect("/user");
    } catch {
        // Redirection vers la page de connexion si échec de connexion
        return res.redirect(`/login?username=${username}`);
    }
});

/**
 * Déconnexion. Suppression de la session associée au token.
 */
router.post("/api/deconnection", async (req, res) => {
    const token = req.headers.cookie
        .split(";")
        .filter((c) => c.includes("token"))[0]
        .split("=")[1];
    try {
        // Suppression de la session
        const message = await SessionController.deleteSession(token);
        res.status(200).json({ message });
        console.log("Session supprimée");
    } catch (err) {
        res.status(400).json({ message: err });
    }
});

/**
 * Page de l'utilisateur. Vérifie si l'utilisateur est connecté.
 */
router.get("/:id", async (req, res) => {
    try {
        await SessionController.isLogin(req.cookies.token);
        return res.sendFile(path.join(__dirname, "../vue/user.html"));
    } catch {
        return res.redirect("/user");
    }
});

/**
 * Récupération de la liste des utilisateurs. Seulement accessible par les administrateurs.
 */
router.get("/api/all", async (req, res) => {
    let users = undefined;
    let userData = undefined;
    const token = req.headers.cookie
        .split(";")
        .filter((c) => c.includes("token"))[0]
        .split("=")[1];
    const name = req.query.name;

    let secureName = undefined;
    if (name) {
        try {
            // Vérification de sécurité sur le nom
            secureName = await secureEntry.secureInputValidation(name);
        } catch (err) {
            return res.status(400).send("Nom invalide : " + err);
        }
    } else {
        secureName = "";
    }

    try {
        // Vérification de la session
        userData = await SessionController.isLogin(token, false);
        if (userData.isAdmin === 1) {
            // Récupération des utilisateurs si l'utilisateur est administrateur
            users = await UserController.getData(
                null,
                {
                    username: name.length > 0 ? `%${secureName}%` : "%",
                },
                token
            );
            console.log("Response Users : ", users);
            return res.json({
                message: `Liste des utilisateurs correctement récupérée pour la recherche "${secureName}"`,
                data: users,
            });
        } else {
            return res.status(403).send("Access denied");
        }
    } catch (err) {
        console.log("Erreur : ", err);
        return res.status(403).send("Access denied");
    }
});

/**
 * Récupération des données d'un utilisateur par son ID.
 * Seulement accessible si l'utilisateur est administrateur ou s'il s'agit de ses propres données.
 */
router.get("/api/:id", async (req, res) => {
    let UserData = undefined;
    const token = req.headers.cookie
        .split(";")
        .filter((c) => c.includes("token"))[0]
        .split("=")[1];
    const id = Number(req.params.id);

    if (!token) {
        return res.status(400).send("Aucun token fourni");
    }

    if (!id) {
        return res.status(400).send("L'id doit être un nombre");
    }

    try {
        UserData = await SessionController.isLogin(token);
    } catch (err) {
        console.log(err);
        return res.status(401).send("Accès refusé");
    }
    console.log("Data : ", UserData);

    if (UserData.isAdmin === 0 && Number(UserData.id) !== id) {
        return res.status(401).send("Accès refusé");
    }

    return res.status(200).json({
        message: `Données de l'utilisateur avec l'id ${id} ont été récupérées avec succès`,
        data: UserData,
    });
});

// Exportation du routeur
module.exports = router;
