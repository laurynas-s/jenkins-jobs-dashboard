-- Adminer 4.7.7 MySQL dump

SET NAMES utf8;
SET time_zone = '+02:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

CREATE DATABASE `dashboard` /*!40100 DEFAULT CHARACTER SET utf32 COLLATE utf32_bin */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `dashboard`;

DROP TABLE IF EXISTS `branches`;
CREATE TABLE `branches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jobId` int NOT NULL,
  `branch` text CHARACTER SET utf32 COLLATE utf32_general_ci NOT NULL,
  `main` bit(1) NOT NULL,
  `created` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobId` (`jobId`),
  CONSTRAINT `branches_ibfk_1` FOREIGN KEY (`jobId`) REFERENCES `jobs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf32 COLLATE=utf32_bin;

DROP TABLE IF EXISTS `builds`;
CREATE TABLE `builds` (
  `id` int NOT NULL AUTO_INCREMENT,
  `buildJenkinsId` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `jobId` int NOT NULL,
  `branchId` int NOT NULL,
  `status` enum('ok','error','building') CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `lastOk` bit(1) NOT NULL,
  `version` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `time` datetime NOT NULL,
  `note` longtext CHARACTER SET utf8 COLLATE utf8_general_ci,
  PRIMARY KEY (`id`),
  KEY `jobId` (`jobId`),
  KEY `branchId` (`branchId`),
  CONSTRAINT `builds_ibfk_1` FOREIGN KEY (`jobId`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `builds_ibfk_2` FOREIGN KEY (`jobId`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `builds_ibfk_3` FOREIGN KEY (`branchId`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf32 COLLATE utf32_general_ci NOT NULL,
  `pos` smallint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `job_unique_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf32 COLLATE=utf32_bin;

-- 2020-08-20 20:14:54
