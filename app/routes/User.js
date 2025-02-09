const express = require("express");
const router = express.Router();
const UserController = require("../controllers/UserController.js");
const SessionController = require("../controllers/SessionController.js");
const secureEntry = require("../helper/secureEntry.js");

const path = require("path");

router.use(express.urlencoded({ extended: true }));

router.get("/", async (req, res) => {
  try {
    await SessionController.isLogin(req.cookies.token);
  } catch {
    return res.redirect("/login");
  }
  return res.sendFile(path.join(__dirname, "../vue/home.html"));
});

router.post("/api/create", async (req, res) => {
  const { username, password } = req.body;

  let secureUsername = undefined;
  let securePassword = undefined;

  try {
    secureUsername = await secureEntry.secureInputValidation(username);
  } catch (err) {
    return res.status(400).send("Username invalide : " + err);
  }
  try {
    securePassword = await secureEntry.secureInputValidation(password);
  } catch (err) {
    return res.status(400).send("Password invalide : " + err);
  }

  UserController.createUser({ secureUsername, securePassword });
  return res.redirect("/login");
});

router.post("/api/login", async function (req, res) {
  const { username, password } = req.body;

  let secureUsername = undefined;
  let securePassword = undefined;

  try {
    secureUsername = await secureEntry.secureInputValidation(username);
  } catch (err) {
    return res.status(400).send("Username invalide : " + err);
  }
  try {
    securePassword = await secureEntry.secureInputValidation(password);
  } catch (err) {
    return res.status(400).send("Password invalide : " + err);
  }

  try {
    const token = await SessionController.createSession(
      secureUsername,
      securePassword
    );

    if (!token) {
      return res.redirect(`/login?username=${username}`);
    }
    return res
      .cookie("token", token, {
        domain: "localhost",
        encode: String,
        secure: true,
      })
      .redirect("/user");
  } catch {
    return res.redirect(`/login?username=${username}`);
  }
});

router.get("/api/getData", async (req, res) => {
  console.log("Dans getData");
  const token = req.headers.token || req.cookies.token;

  if (!token) {
    return res.status(400).json({ message: "no token" });
  }

  try {
    const result = await SessionController.isLogin(token);

    if (!result) {
      return res.status(404).json({ message: "no data found" });
    } else {
      return res.status(200).json(result);
    }
  } catch (err) {
    return res.status(401).json({ message: "no valid access" });
  }
});

router.post("/api/deconnection", async (req, res) => {
  const token = req.headers.token;

  try {
    const message = await SessionController.deleteSession(token);
    res.status(200).json({ message });
    console.log("Session supprimée");
  } catch (err) {
    res.status(400).json({ message: err });
  }
});

router.get("/:id", async (req, res) => {
  try {
    await SessionController.isLogin(req.cookies.token);
    return res.sendFile(path.join(__dirname, "../vue/user.html"));
  } catch {
    return res.redirect("/user");
  }
});

router.get("/api/all", async (req, res) => {
  let users = undefined;
  let userData = undefined;
  const token = req.headers.token;
  const name = req.query.name;

  let secureName = undefined;
  if (name) {
    try {
      secureName = await secureEntry.secureInputValidation(name);
    } catch (err) {
      return res.status(400).send("Nom invalide : " + err);
    }
  } else {
    secureName = "";
  }

  try {
    userData = await SessionController.isLogin(token, false);
    if (userData.isAdmin === 1) {
      users = await UserController.getData(
        null,
        {
          username: name.length > 0 ? `%${secureName}%` : "%",
        },
        token
      );
      console.log("Response Users : ", users);
      return res.json({
        message: `Liste des utilisateurs correspondant à la demande correctement récupérée pour la recherche "${secureName}"`,
        data: users,
      });
    } else {
      return res.status(403).send("Acess denied");
    }
  } catch (err) {
    console.log("Erreur : ", err);
    return res.status(403).send("Acess denied");
  }
});

router.get("/api/:id", async (req, res) => {
  let UserData = undefined;
  const token = req.headers.token;
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

module.exports = router;
