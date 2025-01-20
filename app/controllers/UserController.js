module.exports = {
    get: (req, res) => {
        const path = require('path');

        res.sendFile(path.join(__dirname, '../vue/login.html'));
    },
};
