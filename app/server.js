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
    try {
        SessionController.isLogin(req.cookies.token);
    } catch {
        return res.redirect('/login');
    }

    return res.sendFile(path.join(__dirname, 'vue/home.html'));
});

app.get('/login', (req, res) => {
    try {
        SessionController.isLogin(req.cookies.token);
    } catch {
        return res.redirect('/login');
    }

    return res.sendFile(path.join(__dirname, 'vue/home.html'));
});

app.get('/register', (req, res) => {
    try {
        SessionController.isLogin(req.cookies.token);
    } catch {
        return res.redirect('/register');
    }

    return res.sendFile(path.join(__dirname, 'vue/home.html'));
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
