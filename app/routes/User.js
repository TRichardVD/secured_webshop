const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController.js');
const SessionController = require('../controllers/SessionController.js');

const path = require('path');

router.use(express.urlencoded({ extended: true }));

router.get('/', async (req, res) => {
    try {
        await SessionController.isLogin(req.cookies.token);
    } catch {
        return res.redirect('/login');
    }
    return res.sendFile(path.join(__dirname, '../vue/home.html'));
});

router.post('/api/create', (req, res) => {
    const { username, password } = req.body;
    UserController.createUser({ username, password });
    return res.redirect('/login');
});

router.post('/api/login', async function (req, res) {
    const { username, password } = req.body;
    try {
        const token = await SessionController.createSession(username, password);

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
    } catch {
        return res.redirect(`/login?username=${username}`);
    }
});

router.get('/api/getData', async (req, res) => {
    const token = req.headers.token || req.cookies.token;

    if (!token) {
        return res.status(400).json({ message: 'no token' });
    }

    try {
        const TokenData = await SessionController.isLogin(token);
        const result = await UserController.getData({ id: TokenData.sub });

        if (!result) {
            return res.status(404).json({ message: 'no data found' });
        } else {
            return res.status(200).json(result[0]);
        }
    } catch (err) {
        return res.status(401).json({ message: 'no valid access' });
    }
});

router.post('/api/deconnection', async (req, res) => {
    const token = req.headers.token;

    try {
        const message = await SessionController.deleteSession(token);
        res.status(200).json({ message });
        console.log('Session supprimée');
    } catch (err) {
        res.status(400).json({ message: err });
    }
});

module.exports = router;
