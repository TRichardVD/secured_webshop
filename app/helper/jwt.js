const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const privateKey = process.env.PRIVATE_KEY;

const settings = {
  algorithm: "HS256",
};

const createToken = function (data) {
  return new Promise((resolve, reject) => {
    jwt.sign(data, process.env.PRIVATE_KEY, settings, (err, token) => {
      if (err) {
        reject(err);
      } else {
        resolve(token);
      }
    });
  });
};

const verifyToken = function (token) {
  return new Promise((resolve, reject) => {
    console.log("Dans verifyToken TOKEN : ", token);
    jwt.verify(token, privateKey, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

module.exports = { createToken, verifyToken };
