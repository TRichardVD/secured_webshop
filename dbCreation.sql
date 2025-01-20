CREATE DATABASE IF NOT EXISTS `db_webstore`;
USE `db_webstore`;

CREATE TABLE `t_user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(45) NOT NULL,
  `password` VARCHAR(45) NOT NULL,
  `isAdmin` BOOLEAN NOT NULL,
  PRIMARY KEY (`id`));

