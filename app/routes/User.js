const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController.js');
const SessionController = require('../controllers/SessionController.js');

const path = require('path');

router.use(express.urlencoded({ extended: true }));

router.get('/', (req, res) => {
    if (!!SessionController.isLogin(req.cookies.token)) {
        // Retouner la page de l'utilisateur
        return res.sendFile(path.join(__dirname, '../vue/home.html'));
    }
    return res.redirect('/login');
});

router.post('/api/create', (req, res) => {
    const { username, password } = req.body;
    UserController.createUser({ username, password });
    return res.redirect('/login');
});

router.post('/api/login', async function (req, res) {
    const { username, password } = req.body;
    const token = await SessionController.createSession(username, password);
    console.log('hello', token);
    if (!token) {
        return res.redirect(`/login?username=${username}`);
    }
    return res
        .cookie('token', token, {
            domain: 'localhost',
            encode: String,
            secure: true,
        })
        .redirect('/user');
});

router.get('/api/getData', async (req, res) => {
    const token = req.headers.token || req.cookies.token;

    if (!token) {
        return res.status(400).json({ message: 'no token' });
    }

    const TokenData = SessionController.isLogin(token);
    if (!TokenData) {
        return res.status(401).json({ message: 'no valid access' });
    }

    const result = await UserController.getPublicData({ id: TokenData.sub });

    if (!result) {
        return res.status(404).json({ message: 'no data found' });
    }
    try {
        return res.status(200).json({ data: result[0][0] });
    } catch {
        return res.status(500).json({ message: 'error with data got' });
    }
});

module.exports = router;
