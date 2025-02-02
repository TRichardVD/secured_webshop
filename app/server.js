const express = require('express');
const https = require('https');
const fs = require('fs');
const db = require('./model/database');
const path = require('path');
const UserController = require('./controllers/UserController');
const SessionController = require('./controllers/SessionController');
const cookieParser = require('cookie-parser');

const app = express();

const credentials = {
    key: fs.readFileSync('./certificats/server.key'),
    cert: fs.readFileSync('./certificats/server.crt'),
};

app.use(express.static('public'));
app.use(cookieParser());

app.get('/', (req, res) => {
    if (!!SessionController.isLogin(req.cookies.token)) {
        return res.sendFile(path.join(__dirname, 'vue/home.html'));
    }
    return res.redirect('/login');
});

app.get('/login', (req, res) => {
    if (!!SessionController.isLogin(req.cookies.token)) {
        return res.redirect('/user');
    }

    return res.sendFile(path.join(__dirname, './vue/login.html'));
});

app.get('/register', (req, res) => {
    if (!!SessionController.isLogin(req.cookies.token)) {
        return;
    }
    return res.sendFile(path.join(__dirname, './vue/register.html'));
});

app.use('/user', require('./routes/User'));

app.use((req, res) => {
    res.status(404).send('Aucune page trouvée correspondant à votre requête');
});

// Démarrage du serveur
https.createServer(credentials, app).listen(443, () => {
    console.log('Server running on port 443');

    // Connection MySQL
    db.connection();
});
