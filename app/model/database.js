const mysql = require('mysql2/promise');

const settings = {
    host: 'localhost',
    port: '6033',
    user: 'root',
    password: 'root',
    database: 'db_webstore',
};

const tableUser = 't_user';

let conn = undefined;

const connection = function () {
    return mysql
        .createConnection({
            ...settings,
        })
        .then((connect) => {
            console.log('Connected to DB');
            conn = connect;
        })
        .catch((err) => {
            console.log('Error connecting to DB: ', err);
        });
};

const createUser = function ({ username, password, isAdmin = false }) {
    let error = undefined;
    conn.query(
        `INSERT INTO ${tableUser} (username, password, isAdmin) VALUES (?, ?, ?)`,
        [username, password, isAdmin]
    )
        .then((result) => {
            console.log('User created');
        })
        .catch((err) => {
            console.log('Error creating user: ', err);
        });
};

module.exports = { connection, createUser };
