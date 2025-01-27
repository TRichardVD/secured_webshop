const express = require('express');
const https = require('https');
const fs = require('fs');
const db = require('./model/database');
const path = require('path');

const app = express();

const credentials = {
    key: fs.readFileSync('./certificats/server.key'),
    cert: fs.readFileSync('./certificats/server.crt'),
};

app.use(express.static('public'));

//const userRoute = require('./routes/User');
//app.use('/user', userRoute);

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, './vue/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, './vue/register.html'));
});

app.use('/user', require('./routes/User'));

// Démarrage du serveur
https.createServer(credentials, app).listen(443, () => {
    console.log('Server running on port 443');

    // Connection MySQL
    db.connection();
});
