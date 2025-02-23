CREATE DATABASE IF NOT EXISTS `db_webstore`;
USE `db_webstore`;

-- Table principale des utilisateurs
CREATE TABLE `t_users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(45) NOT NULL UNIQUE,
  `email` VARCHAR(255) UNIQUE,  -- Ajout email pour OAuth
  `passwordHashed` VARCHAR(255),  -- Nullable car pas nécessaire pour OAuth
  `isAdmin` BOOLEAN NOT NULL DEFAULT '0',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- `status` ENUM('active', 'inactive', 'banned') DEFAULT 'active',
  PRIMARY KEY (`id`)
);

-- Table pour les connexions OAuth
CREATE TABLE `t_oauth_accounts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `fkUser` INT NOT NULL,
  `provider` VARCHAR(50) NOT NULL,  -- 'google', 'github', etc.
  `provider_user_id` VARCHAR(255) NOT NULL,  -- ID unique du provider
  `provider_email` VARCHAR(255),
  `access_token` VARCHAR(2048),
  `refresh_token` VARCHAR(2048),
  `token_expires_at` TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `provider_constraint` (`provider`, `provider_user_id`),
  FOREIGN KEY (`fkUser`) REFERENCES `t_users` (`id`) ON DELETE CASCADE
);

-- Table des sessions
CREATE TABLE `t_sessions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `fkUser` INT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NOT NULL,
  -- `ip_address` VARCHAR(45),              -- Tracking IP
  -- `user_agent` VARCHAR(255),             -- Tracking navigateur
  PRIMARY KEY (`id`),
  FOREIGN KEY (`fkUser`) REFERENCES `t_users` (`id`) ON DELETE CASCADE
);
