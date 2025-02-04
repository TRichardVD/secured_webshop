const jwt = require('../helper/jwt');
const db = require('../model/database');
const dotenv = require('dotenv');
const helper = require('../helper/helper');
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
        iat: Date.UTC(2025, 1, 3, 15, 0, 0),
        exp: Date.UTC(2025, 1, 3, 15, 0, 0) + 60 * 60 * 1000,
    };

    let sessionCreated = false;
    const iatStr = new Date(dataToken.iat)
        .toJSON()
        .slice(0, 19)
        .replace('T', ' ');
    const expStr = new Date(dataToken.exp)
        .toJSON()
        .slice(0, 19)
        .replace('T', ' ');

    try {
        // Ajout à la db
        await db.pool.query(
            `INSERT INTO ${db.tableSession} (fkUser, created_at, expires_at) VALUES (?, ?, ?)`,
            [data.id, iatStr, expStr]
        );
        sessionCreated = true;

        // Récupération de l'id du token créé
        const Token = await db.pool.query(
            `SELECT id FROM ${db.tableSession} WHERE fkUser = ? AND created_at = ? AND expires_at = ? LIMIT 1`,
            [data.id, iatStr, expStr]
        );

        if (!Token || !Token[0]) {
            throw new Error("Impossible de récupérer l'ID de session");
        }
        const idToken = Token[0].id;

        // Génération du token
        const token = await jwt.createToken({ ...dataToken, jti: idToken });

        console.log('Voici le nouveau token ', token);
        return token;
    } catch (err) {
        console.error('Erreur lors de la création de session : ', err);

        if (sessionCreated) {
            try {
                await db.pool.query(
                    `DELETE FROM ${db.tableSession} 
           WHERE fkUser = ? AND created_at = ? AND expires_at = ?`,
                    [data.id, iatStr, expStr]
                );
            } catch (deleteErr) {
                console.error(
                    'Erreur lors de la suppression de session : ',
                    deleteErr
                );
            }
        }

        return undefined;
    }
};

const isLogin = function (token) {
    return new Promise(async (resolve, reject) => {
        if (!token) {
            reject('Aucun token');
            return;
        }

        try {
            await jwt.verifyToken(token);
        } catch (error) {
            console.error('Erreur de vérification du token : ', error.message);
            reject('Token Invalide');
            return;
        }

        const decoded = jwt.decodToken(token);

        try {
            // Vérifie si le token correspond à une session active dans la base de données
            const result = await db.pool.query(
                `SELECT id FROM ${db.tableSession} WHERE id = ?`,
                [decoded.jti]
            );

            if (result.length === 1) {
                // Si on trouve une entrée valide
                resolve(await jwt.decodToken(token)); // Retourne l'objet token décodé
                return;
            }
        } catch (err) {
            console.error(
                'Erreur dans la verification du token dans la db : ' + err
            );
            reject('Erreur base de données'); // Retourne undefined en cas d'erreur dans la DB
            return;
        }
        reject('Token refusé');
        return;
    });
};

const deleteSession = async function (token) {
    // TODO : Fonction permettant de supprimer une session afin de se deconnecter proprement
    return new Promise(async (resolve, reject) => {
        // Vérification du login
        try {
            await isLogin(token);
        } catch (err) {
            reject(err);
            return;
        }

        db.pool
            .query(`DELETE FROM ${db.tableSession} WHERE id=?`, [decoded.sub])
            .then((result) => {
                console.log(`Token ${decoded.sub} a été supprimé`);
                resolve(`Le token avec l'id ${decoded.sub} a été supprimé`);
                return;
            })
            .catch((err) => {
                console.error(
                    `Une erreur s'est produite durant la suppression du token avec l'id ${decoded.id} : ` +
                        err
                );
                reject("Une erreur s'est produite durant la suppression");
                return;
            });
    });
};

module.exports = { createSession, isLogin, deleteSession };
