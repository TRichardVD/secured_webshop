const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/', (req, res) => {
    console.log('Route login appelée');
    console.log(
        'Chemin du fichier:',
        path.join(__dirname, '../vue/login.html')
    );

    res.sendFile(path.join(__dirname, '../vue/login.html'));
});

module.exports = router;
