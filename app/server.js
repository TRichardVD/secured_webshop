const express = require("express");
const https = require('https')
const fs = require('fs');

const app = express();

const credentials = {
    key: fs.readFileSync('./certificats/server.key'),
    cert: fs.readFileSync('./certificats/server.crt')
  };

const userRoute = require('./routes/User');
app.use('/user', userRoute);

// Démarrage du serveur
https.createServer(credentials, app).listen(443, () => {
    console.log('Server running on port 443');
});