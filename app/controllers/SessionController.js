const jwt = require('../helper/jwt');
const db = require('../model/database');
const dotenv = require('dotenv');
const helper = require('../helper/helper');
const UserController = require('./UserController');
const hashage = require('../helper/hashage');

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

    // Vérification du mot de passe
    if (!hashage.compareHash(data.salt, password, data.passwordHashed)) {
        console.error('Mot de passe incorrect');
        return;
    }

    // Infos du token
    const dataToken = {
        sub: data.id,
        userCreation: data.created_at,
        admin: data.isAdmin === 1,
        iat: Math.floor(new Date() / 1000),
        exp: Math.floor(new Date() / 1000) + 60 * 60,
    };
    let sessionCreated = false;
    const iatStr = new Date(dataToken.iat * 1000)
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');
    const expStr = new Date(dataToken.exp * 1000)
        .toISOString()
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
            `SELECT id FROM ${db.tableSession} WHERE fkUser = ? AND created_at = ? AND expires_at = ? ORDER BY created_at DESC LIMIT 1`,
            [data.id, iatStr, expStr]
        );

        if (!Token) {
            throw new Error("Impossible de récupérer l'ID de session");
        }
        const idToken = Token[0][0].id;

        // Génération du token
        dataToken.jti = idToken;

        const token = await jwt.createToken(dataToken);

        console.log('Nouveau token ', token);
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

        let decoded = undefined;

        try {
            decoded = await jwt.verifyToken(token);
        } catch (error) {
            console.error('Erreur de vérification du token : ', error.message);
            reject('Token Invalide');
            return;
        }

        try {
            // Vérifie si le token correspond à une session active dans la base de données
            const result = await db.pool.query(
                `SELECT id FROM ${db.tableSession} WHERE id = ?`,
                [decoded.jti]
            );

            if (result[0].length === 1) {
                // Si on trouve une entrée valide
                resolve(decoded); // Retourne l'objet token décodé
                return;
            } else {
                reject('Token non trouvé dans la base de données');
                return;
            }
        } catch (err) {
            console.error(
                'Erreur dans la verification du token dans la db : ' + err
            );
            reject('Erreur base de données'); // Retourne undefined en cas d'erreur dans la DB
            return;
        }
    });
};

const deleteSession = function (token) {
    // TODO : Fonction permettant de supprimer une session afin de se deconnecter proprement
    return new Promise(async (resolve, reject) => {
        // Vérification du login
        let decoded = undefined;
        try {
            decoded = await isLogin(token);

            const resultQuery = await db.pool.query(
                `DELETE FROM ${db.tableSession} WHERE id=?`,
                [decoded.jti]
            );
            if (resultQuery[0].affectedRows !== 1) {
                throw new Error('Erreur lors de la suppression de la session');
            }
            resolve('Session supprimée');
        } catch (error) {
            console.error(
                'Erreur lors de la suppression de la session : ',
                error
            );
            reject('Erreur lors de la suppression de la session');
        }
    });
};

module.exports = { createSession, isLogin, deleteSession };
