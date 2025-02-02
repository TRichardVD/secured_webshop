const mysql = require('mysql2/promise');

const settings = {
    host: 'localhost',
    port: 6033,
    user: 'root',
    password: 'root',
    database: 'db_webstore',
};

const tableUser = 't_user';
const tableSession = 't_session';

const pool = mysql.createPool(settings);

const getConnection = function () {
    try {
        const connection = pool.getConnection().catch((err) => {
            if (err) {
                console.error('Error connecting to DB:', err);
                return err;
            }
        });
        console.log('Connected to DB');
        return connection;
    } catch (err) {
        console.error('Error connecting to DB:', err);
        throw err;
    }
};

module.exports = { pool, connection: getConnection, tableUser, tableSession };
