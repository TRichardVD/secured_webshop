const mysql = require("mysql2/promise");

const settings = {
    host: "localhost",
    port: 6033,
    user: "root",
    password: "root",
    database: "db_webstore",
};

const tableUser = "t_users";
const tableSession = "t_sessions";

const pool = mysql.createPool(settings);

const getConnection = function () {
    const connection = pool
        .getConnection()
        .then((result) => {
            console.log("Database connected");
        })
        .catch((err) => {
            if (err) {
                console.error("Error connecting to DB:", err);
                return err;
            }
        });
    return connection;
};

module.exports = { pool, connection: getConnection, tableUser, tableSession };
