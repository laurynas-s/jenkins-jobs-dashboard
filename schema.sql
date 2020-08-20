-- Adminer 4.7.7 MySQL dump

SET NAMES utf8;
SET time_zone = '+00:00';
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

INSERT INTO `branches` (`id`, `jobId`, `branch`, `main`, `created`) VALUES
(2,	1,	'develop',	CONV('1', 2, 10) + 0,	'2020-08-07 15:10:56'),
(3,	1,	'master',	CONV('0', 2, 10) + 0,	'2020-08-07 15:10:56'),
(4,	3,	'develop',	CONV('1', 2, 10) + 0,	'2020-08-07 15:27:22'),
(5,	1,	'feature 1',	CONV('0', 2, 10) + 0,	'2020-08-08 12:00:23'),
(6,	2,	'develop',	CONV('0', 2, 10) + 0,	'2020-08-09 17:15:44'),
(7,	2,	'master',	CONV('1', 2, 10) + 0,	'2020-08-10 11:00:16'),
(14,	4,	'develop',	CONV('1', 2, 10) + 0,	'2020-08-10 11:07:05'),
(15,	6,	'develop',	CONV('1', 2, 10) + 0,	'2020-08-10 11:07:05'),
(16,	5,	'develop',	CONV('1', 2, 10) + 0,	'2020-08-10 11:07:05'),
(17,	14,	'develop',	CONV('1', 2, 10) + 0,	'2020-08-10 11:07:05'),
(18,	13,	'develop',	CONV('1', 2, 10) + 0,	'2020-08-10 11:07:05');

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

INSERT INTO `builds` (`id`, `buildJenkinsId`, `jobId`, `branchId`, `status`, `lastOk`, `version`, `duration`, `time`, `note`) VALUES
(1,	'',	1,	2,	'ok',	CONV('0', 2, 10) + 0,	'123',	1000,	'2020-08-07 15:15:03',	NULL),
(2,	'',	1,	3,	'error',	CONV('0', 2, 10) + 0,	'789',	2000,	'2020-08-07 15:15:29',	'Some error'),
(3,	'',	1,	2,	'ok',	CONV('1', 2, 10) + 0,	'1.0.0',	50000,	'2020-08-08 11:54:07',	NULL),
(4,	'',	3,	4,	'ok',	CONV('1', 2, 10) + 0,	'9999',	3000,	'2020-08-07 15:28:55',	NULL),
(5,	'',	2,	6,	'ok',	CONV('0', 2, 10) + 0,	'1',	5000,	'2020-08-09 19:03:18',	NULL),
(6,	'',	2,	6,	'ok',	CONV('1', 2, 10) + 0,	'2',	6000,	'2020-08-09 19:04:58',	NULL),
(7,	'',	2,	6,	'error',	CONV('0', 2, 10) + 0,	NULL,	NULL,	'2020-08-10 13:43:17',	'Something wrong happpened'),
(8,	'',	5,	16,	'building',	CONV('0', 2, 10) + 0,	NULL,	NULL,	'2020-08-10 13:45:06',	NULL),
(9,	'',	2,	7,	'ok',	CONV('1', 2, 10) + 0,	'123123',	60000,	'2020-08-11 10:14:17',	NULL),
(10,	'',	2,	7,	'error',	CONV('0', 2, 10) + 0,	NULL,	NULL,	'2020-08-11 10:15:04',	'Failed error Failed error Failed error Failed error Failed error ');

DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf32 COLLATE utf32_general_ci NOT NULL,
  `pos` smallint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `job_unique_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf32 COLLATE=utf32_bin;

INSERT INTO `jobs` (`id`, `name`, `pos`) VALUES
(1,	'dependency X',	1),
(2,	'dependency Y',	6),
(3,	'Module A',	2),
(4,	'Module B',	3),
(5,	'Module C',	4),
(6,	'Module D',	5),
(13,	'Module E',	999),
(14,	'Module F',	999);

-- 2020-08-20 20:14:54
