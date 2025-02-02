const jwt = require('jsonwebtoken');
const db = require('../model/database');
const dotenv = require('dotenv');
const helper = require('../helper');
const UserController = require('./UserController');

dotenv.config();

const createSession = async function (username, password) {
    // Vérification de paramètre de connection et récupération des données manquantes
    const allData = await UserController.getData({ username });

    if (!allData) {
        return;
    }

    let data = undefined;
    try {
        data = allData[0];
    } catch (error) {
        return;
    }

    if (!data) {
        return;
    }

    // Infos du token
    const dataToken = {
        sub: data.id,
        userCreation: data.created_at,
        admin: data.isAdmin === 1,
        iat: Date.now(),
        exp: Date.now() + 60 * 60,
    };

    // Ajout à la db
    console.log('Ajout à la db');

    await db.pool
        .query(
            `INSERT INTO ? (fkUser, created_at, expires_at) VALUES (?, ?, ?)`,
            [db.tableSession, data.id, dataToken.iat, dataToken.exp]
        )
        .catch((err) => {
            console.error("Impossible d'ajouter le token à la db : " + err);
            return;
        });

    // Récupération de l'id du token créé
    const idToken = await db.pool.query(
        'SELECT id FROM ? WHERE fkUser = ? AND created_at = ? AND expires_at = ? LIMIT 1',
        [db.tableSession, data.id, dataToken.iat, dataToken.exp]
    );

    console.log('Generation du token');
    // Génération du token
    const token = await new Promise((resolve, reject) => {
        jwt.sign(
            { ...dataToken, jti: idToken.id },
            process.env.PRIVATE_KEY,
            {
                algorithm: 'HS256',
            },
            (err, result) => {
                if (err) {
                    reject(err);
                    console.error(err);
                } else {
                    resolve(result);
                }
            }
        )
            .then((result) => {
                return result;
            })

            .catch((err) => {
                console.error(
                    "Une erreur s'est produite durant la création du token : " +
                        err
                );
            });
    });

    // Retourner le token
    return token;
};

const isLogin = function (token) {
    if (!token) {
        return false;
    }

    let decoded = undefined;
    try {
        decoded = jwt.verify(token, process.env.PRIVATE_KEY);
    } catch (error) {
        console.error('Erreur de vérification du token : ', error.message);
        return undefined;
    }

    if (!decoded) {
        return undefined;
    }

    const resultQuery = db.pool.query(
        'SELECT id FROM ? WHERE id = ? AND expires_at = ? AND expires_at > ? AND created_at = ? AND fkUser = ?',
        [
            db.tableSession,
            decoded.jti,
            decoded.exp,
            Date.now(),
            decoded.iat,
            decoded.sub,
        ]
    );

    if (!resultQuery || resultQuery.length > 1) {
        return undefined;
    }

    return decoded;
};

const deleteSession = async function (idToken) {
    try {
        db.pool.query('DELETE FROM ? WHERE id = ?', [db.tableSession, idToken]);
        if (
            !db.pool.query(
                'SELECT id FROM ? WHERE id = ? AND expires_at = ? AND expires_at > ? AND created_at = ? AND fkUser = ?',
                [
                    db.tableSession,
                    decoded.jti,
                    decoded.exp,
                    Date.now(),
                    decoded.iat,
                    decoded.sub,
                ]
            )
        ) {
            return true;
        }
    } catch (err) {
        return false;
    }
};

module.exports = { createSession, isLogin };
