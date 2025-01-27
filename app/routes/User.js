const express = require('express');
const router = express.Router();
const model = require('../model/database.js');

router.use(express.urlencoded({ extended: true }));
router.post('/create', (req, res) => {
    const { username, password } = req.body;
    model.createUser({ username, password });
    console.log('Hello !', username, password);
    res.send('Hello');
});

module.exports = router;
