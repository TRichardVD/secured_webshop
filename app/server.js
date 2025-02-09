const express = require("express");
const https = require("https");
const fs = require("fs");
const db = require("./model/database");
const path = require("path");
const UserController = require("./controllers/UserController");
const SessionController = require("./controllers/SessionController");
const cookieParser = require("cookie-parser");

const app = express();

const credentials = {
  key: fs.readFileSync("./certificats/server.key"),
  cert: fs.readFileSync("./certificats/server.crt"),
};

app.use(express.static("public"));
app.use(cookieParser());

app.get("/", async (req, res) => {
  try {
    await SessionController.isLogin(req.cookies.token);
  } catch (err) {
    console.log(err);
    return res.redirect("/login");
  }

  return res.sendFile(path.join(__dirname, "vue/home.html"));
});

app.get("/login", async (req, res) => {
  try {
    await SessionController.isLogin(req.cookies.token);
  } catch (err) {
    console.log(err);
    return res.sendFile(path.join(__dirname, "./vue/login.html"));
  }

  return res.redirect("/user");
});

app.get("/register", async (req, res) => {
  try {
    await SessionController.isLogin(req.cookies.token);
  } catch (err) {
    console.log(err);
    return res.sendFile(path.join(__dirname, "vue/register.html"));
  }
  return res.redirect("/user");
});

app.use("/user", require("./routes/User"));

app.get("/admin", async (req, res) => {
  try {
    const userinfos = await SessionController.isLogin(req.cookies.token);
    if (userinfos.isAdmin === 1) {
      return res
        .status(200)
        .sendFile(path.join(__dirname, "./vue/adminDashboard.html"));
    } else {
      res.status(403).send("Access denied");
    }
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send("Une erreur est survenue veuillez reessayer plus tard");
  }
});

// Page 404
app.use((req, res) => {
  res.status(404).send("Aucune page trouvée correspondant à votre requête");
});

// Démarrage du serveur
https.createServer(credentials, app).listen(443, () => {
  console.log("Server running on port 443");

  // Connection MySQL
  db.connection();
});
