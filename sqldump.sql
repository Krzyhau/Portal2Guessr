-- phpMyAdmin SQL Dump
-- version 4.8.5

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


CREATE TABLE `locations` (
  `location_id` int(11) NOT NULL,
  `creation_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `creator_id` int(11) NOT NULL,
  `mapname` varchar(256) COLLATE utf8_bin NOT NULL,
  `x` float NOT NULL,
  `y` float NOT NULL,
  `image` mediumblob NOT NULL,
  `thumbnail` mediumblob NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;


CREATE TABLE `powerusers` (
  `poweruser_id` int(11) NOT NULL,
  `username` varchar(255) COLLATE utf8_bin NOT NULL,
  `secret_key` varchar(255) COLLATE utf8_bin NOT NULL,
  `power_level` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;


ALTER TABLE `locations`
  ADD PRIMARY KEY (`location_id`),
  ADD KEY `creator` (`creator_id`);

ALTER TABLE `powerusers`
  ADD PRIMARY KEY (`poweruser_id`);


ALTER TABLE `locations`
  MODIFY `location_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

ALTER TABLE `powerusers`
  MODIFY `poweruser_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

ALTER TABLE `locations`
  ADD CONSTRAINT `fk_creator_id` FOREIGN KEY (`creator_id`) REFERENCES `powerusers` (`poweruser_id`);
COMMIT;

