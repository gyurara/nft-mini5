-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: pawchain
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `goods_orders`
--

DROP TABLE IF EXISTS `goods_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `goods_orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `burn_tx_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `goods_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_label` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `memo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nft_token_id` bigint DEFAULT NULL,
  `owner_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `recipient_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('PENDING','CONFIRMED','SHIPPING','DELIVERED','CANCELLED') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goods_orders`
--

LOCK TABLES `goods_orders` WRITE;
/*!40000 ALTER TABLE `goods_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `goods_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hospital_connections`
--

DROP TABLE IF EXISTS `hospital_connections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hospital_connections` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `owner_address` varchar(42) NOT NULL,
  `vet_address` varchar(42) NOT NULL,
  `pet_sbt_id` bigint NOT NULL,
  `connected` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_owner_vet` (`owner_address`,`vet_address`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hospital_connections`
--

LOCK TABLES `hospital_connections` WRITE;
/*!40000 ALTER TABLE `hospital_connections` DISABLE KEYS */;
INSERT INTO `hospital_connections` VALUES (1,'0x063e2947dcd0cd0b519025a8133cbdb1bb5e8a2a','0xbbd2df1a746bdee8d0e0d4ca0726864034675209',11,1,'2026-04-09 16:12:34','2026-04-10 04:23:55');
/*!40000 ALTER TABLE `hospital_connections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_records`
--

DROP TABLE IF EXISTS `medical_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_records` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `diagnosis_encrypted` text COLLATE utf8mb4_unicode_ci,
  `hospital_encrypted` text COLLATE utf8mb4_unicode_ci,
  `memo_encrypted` text COLLATE utf8mb4_unicode_ci,
  `owner_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pet_sbt_id` bigint DEFAULT NULL,
  `record_type` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `treatment_encrypted` text COLLATE utf8mb4_unicode_ci,
  `vet_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visit_date` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_records`
--

LOCK TABLES `medical_records` WRITE;
/*!40000 ALTER TABLE `medical_records` DISABLE KEYS */;
INSERT INTO `medical_records` VALUES (1,'2026-04-10 01:13:08.619444','aa1f915c14a9cab698b7d1adfa2dda2a:pcaeyu0qRiXeaj7lis/9Rg==','c2847c77910b00126c48cffd78b05e50:SmbMb4Q2xo7tWGqJiLe0iQ==','7e6c3b38a747a0cbb4791f41dc69bde2:ZAsYqBOztmiS8b/bRO30/g==','0x063e2947dcd0cd0b519025a8133cbdb1bb5e8a2a',4,'진료','3c833b2cc83c5d891cf814e63683c107:iByMsBhrgUYpupTitoRqYA==','0xbbd2df1a746bdee8d0e0d4ca0726864034675209',1775692800),(2,'2026-04-10 01:55:21.140859','f3951690b0d3f27e2533ef019292ffec:NFIarbVrbHQiOrrWkjgScQ==','0ab48bf04e90876d32398f53b9cc65c6:yxaZGLD+nfHTvbmEdoDEMw==','08ff124914a7b60fa32a90058b48ec14:Ie9/TPHIB+/rXZphc1SAYIQ0RdxNvT/ZiwIH5sk080EawFrg/5U9M2SP2SeVxotu','0x063e2947dcd0cd0b519025a8133cbdb1bb5e8a2a',5,'진료','2b16aa899c16aae7ed5edb30e22e1191:vWPRIQa9TMYqrIjcOBi/6w==','0xbbd2df1a746bdee8d0e0d4ca0726864034675209',1775779200),(3,'2026-04-10 13:24:32.890264','b2c5439ade58cac106be264b2d9c22c6:rmF4WPaGsJBe3rSO6Fd2jw==','aa175e8dded0e7c4157fcb2cbafdc984:Qsd2O7WHGx3sROOQJek//g==','d43651b7f2f4ffdbc76beacd10d2e1e4:mY7tugkiv919SK//E2XsJg==','0x063e2947dcd0cd0b519025a8133cbdb1bb5e8a2a',11,'진료','d4b1bc9bb0ca57bc1a7c43025f7856df:SUWNEJvBjvquDr2u3yldwQ==','0xbbd2df1a746bdee8d0e0d4ca0726864034675209',1775779200);
/*!40000 ALTER TABLE `medical_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_records_simple`
--

DROP TABLE IF EXISTS `medical_records_simple`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_records_simple` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `account` varchar(42) NOT NULL,
  `pet_sbt_id` bigint NOT NULL,
  `record_type` varchar(80) NOT NULL,
  `description` text NOT NULL,
  `vet_address` varchar(42) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_records_simple`
--

LOCK TABLES `medical_records_simple` WRITE;
/*!40000 ALTER TABLE `medical_records_simple` DISABLE KEYS */;
/*!40000 ALTER TABLE `medical_records_simple` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pet_profiles`
--

DROP TABLE IF EXISTS `pet_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pet_profiles` (
  `account` varchar(42) NOT NULL,
  `pet` json NOT NULL,
  `sbt` json DEFAULT NULL,
  `nfts` json NOT NULL DEFAULT (_utf8mb4'[]'),
  `nft_count` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`account`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pet_profiles`
--

LOCK TABLES `pet_profiles` WRITE;
/*!40000 ALTER TABLE `pet_profiles` DISABLE KEYS */;
INSERT INTO `pet_profiles` VALUES ('0x063e2947dcd0cd0b519025a8133cbdb1bb5e8a2a','{\"id\": \"8bfe42f6-716f-43f2-9fd5-d2abe4689ad7\", \"name\": \"giv\", \"gender\": \"남아\", \"species\": \"강아지\", \"imageUrl\": \"/uploads/1775753509738-4f49ff86d23b.jpg\", \"adoptDate\": \"2020-02-05\", \"birthDate\": \"2020-02-04\", \"createdAt\": \"2026-04-09T05:44:12.031Z\", \"updatedAt\": \"2026-04-10T04:21:19.886Z\"}','{\"tokenId\": 11, \"metadata\": {\"name\": \"Pet #11\", \"image\": \"https://placekitten.com/400/400\", \"attributes\": [{\"value\": \"강아지\", \"trait_type\": \"종\"}, {\"value\": \"2020-02-04\", \"trait_type\": \"생년월일\"}, {\"value\": \"giv\", \"trait_type\": \"이름\"}], \"description\": \"반려동물 신원 SBT\"}, \"mintedAt\": \"2026-04-10T04:21:45.017Z\", \"transactionHash\": \"0x2e850443ae04a92c08bcdee31d53ca1a2570baf8709841451653caa1feedeee2\"}','[{\"tokenId\": 43, \"metadata\": {\"name\": \"Pet #43\", \"image\": \"http://localhost:4000/uploads/1775713451564-755ef2c3b84f.jpg\", \"attributes\": [{\"value\": \"강아지\", \"trait_type\": \"종\"}, {\"value\": \"2018-02-04\", \"trait_type\": \"생년월일\"}, {\"value\": \"fgs\", \"trait_type\": \"이름\"}], \"description\": \"반려동물 NFT\"}, \"mintedAt\": \"2026-04-09T06:02:46.624Z\", \"transactionHash\": \"0x96035d70aeca7fcac47cdda2b671e0765adce504de2239ecfc4527645752fc28\"}, {\"tokenId\": 2, \"metadata\": {\"name\": \"Pet #2\", \"image\": \"/uploads/1775747821228-fdf5d0634637.jpg\", \"attributes\": [{\"value\": \"강아지\", \"trait_type\": \"종\"}, {\"value\": \"2020-02-05\", \"trait_type\": \"생년월일\"}, {\"value\": \"ㅁㅇㅁㄹ\", \"trait_type\": \"이름\"}], \"description\": \"반려동물 NFT\"}, \"mintedAt\": \"2026-04-09T15:17:18.845Z\", \"transactionHash\": \"0xb1a1eebbb85b29f0c6a051f06dcb0bae72337d2f1255a557353d34bd70a6eba4\"}, {\"tokenId\": 3, \"metadata\": {\"name\": \"Pet #3\", \"image\": \"https://placekitten.com/400/400\", \"attributes\": [{\"value\": \"강아지\", \"trait_type\": \"종\"}, {\"value\": \"2020-02-04\", \"trait_type\": \"생년월일\"}, {\"value\": \"giv\", \"trait_type\": \"이름\"}], \"description\": \"반려동물 NFT\"}, \"mintedAt\": \"2026-04-10T04:25:09.878Z\", \"transactionHash\": \"0x47ed663c4253dbc47814fd3d90874bef886a5ff0cb6d2a3c800459eb2aee712f\"}]',3,'2026-04-09 05:44:12','2026-04-10 04:25:10');
/*!40000 ALTER TABLE `pet_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pet_transactions`
--

DROP TABLE IF EXISTS `pet_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pet_transactions` (
  `account` varchar(42) NOT NULL,
  `kind` varchar(64) NOT NULL,
  `data` json NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`account`,`kind`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pet_transactions`
--

LOCK TABLES `pet_transactions` WRITE;
/*!40000 ALTER TABLE `pet_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `pet_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pet_vet_approvals`
--

DROP TABLE IF EXISTS `pet_vet_approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pet_vet_approvals` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `pet_sbt_id` varchar(100) NOT NULL,
  `owner_address` varchar(100) NOT NULL,
  `vet_address` varchar(100) NOT NULL,
  `owner_signature` varchar(255) DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `tx_hash` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pet_vet` (`pet_sbt_id`,`vet_address`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pet_vet_approvals`
--

LOCK TABLES `pet_vet_approvals` WRITE;
/*!40000 ALTER TABLE `pet_vet_approvals` DISABLE KEYS */;
INSERT INTO `pet_vet_approvals` VALUES (1,'4','0x063e2947dcd0cd0b519025a8133cbdb1bb5e8a2a','0xbbd2df1a746bdee8d0e0d4ca0726864034675209','owner-approved',1,'0x3b4a01fe458ef87ec9cf53ab93399b93a62b35c98ff17aa484851b8b6185545f','2026-04-10 01:12:34','2026-04-10 01:12:34'),(2,'5','0x063e2947dcd0cd0b519025a8133cbdb1bb5e8a2a','0xbbd2df1a746bdee8d0e0d4ca0726864034675209','owner-approved',1,'0x69a6228fb844687d0e091c021ba4ba074d547a2456292896e4433280b10241c7','2026-04-10 01:54:19','2026-04-10 01:54:19'),(3,'11','0x063e2947dcd0cd0b519025a8133cbdb1bb5e8a2a','0xbbd2df1a746bdee8d0e0d4ca0726864034675209','owner-approved',1,'0xdf0b6dc8ee1fdbbc5f7201f83cb79d6846c90834169da0631abc0e4de52b338c','2026-04-10 13:23:55','2026-04-10 13:23:55');
/*!40000 ALTER TABLE `pet_vet_approvals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pets`
--

DROP TABLE IF EXISTS `pets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `birth_date` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `image` mediumtext COLLATE utf8mb4_unicode_ci,
  `image_hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `like_count` int DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nft_value` int DEFAULT NULL,
  `owner_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registration_no` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `s3image_key` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `s3image_url` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sbt_token_id` bigint DEFAULT NULL,
  `species` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_id` bigint DEFAULT NULL,
  `tx_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `adopt_date` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_qsf5wow0m6v6wjqogfjkfuhtv` (`sbt_token_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pets`
--

LOCK TABLES `pets` WRITE;
/*!40000 ALTER TABLE `pets` DISABLE KEYS */;
INSERT INTO `pets` VALUES (1,'2018-02-04','2026-04-09 14:44:12.115020',NULL,NULL,0,'fgs',1000,'0x063e2947dcd0cd0b519025a8133cbdb1bb5e8a2a',NULL,NULL,NULL,NULL,'강아지',43,'0x96035d70aeca7fcac47cdda2b671e0765adce504de2239ecfc4527645752fc28','남아','2018-02-05'),(5,NULL,'2026-04-09 20:18:43.409488',NULL,NULL,0,'치코',1000,'0x42980adc046eb8428b29d8a5e5f20c90a6916b54',NULL,NULL,NULL,NULL,'강아지',NULL,NULL,'남아','2026-04-01'),(6,'2020-02-05','2026-04-10 00:16:14.690606',NULL,NULL,0,'ㅁㅇㅁㄹ',1000,'0x063e2947dcd0cd0b519025a8133cbdb1bb5e8a2a',NULL,NULL,'/uploads/1775747773611-a00b2fe457ed.jpg',4,'강아지',2,'0x471aa1daaddd77f4659bb82adbeb7579cec1dffb181da7a51eb7345e744b1bfe','남아','2020-02-06'),(7,'2020-03-04','2026-04-10 01:51:50.626455',NULL,NULL,0,'ㅁㄹㅇ',1000,'0x063e2947dcd0cd0b519025a8133cbdb1bb5e8a2a',NULL,NULL,'/uploads/1775753509738-4f49ff86d23b.jpg',11,'강아지',3,'0x2e850443ae04a92c08bcdee31d53ca1a2570baf8709841451653caa1feedeee2','남아','2020-03-05');
/*!40000 ALTER TABLE `pets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role` enum('USER','ORG') NOT NULL DEFAULT 'USER',
  `name` varchar(100) NOT NULL,
  `email` varchar(200) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `wallet_address` varchar(42) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `license_number` varchar(50) DEFAULT NULL,
  `location` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_email` (`email`),
  UNIQUE KEY `uk_wallet` (`wallet_address`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'ORG','Hospital_bbd2df','0xbbd2df1a746bdee8d0e0d4ca0726864034675209@wallet.local','','0xbbd2df1a746bdee8d0e0d4ca0726864034675209',NULL,NULL,NULL,'2026-04-09 05:40:17','2026-04-09 16:32:32'),(39,'ORG','Hospital_42980a','0x42980adc046eb8428b29d8a5e5f20c90a6916b54@wallet.local','','0x42980adc046eb8428b29d8a5e5f20c90a6916b54',NULL,NULL,NULL,'2026-04-09 10:41:32','2026-04-09 10:41:32'),(41,'ORG','User_063e29','0x063e2947dcd0cd0b519025a8133cbdb1bb5e8a2a@wallet.local','','0x063e2947dcd0cd0b519025a8133cbdb1bb5e8a2a',NULL,NULL,NULL,'2026-04-09 16:50:50','2026-04-10 04:19:30');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vet_connection_requests`
--

DROP TABLE IF EXISTS `vet_connection_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vet_connection_requests` (
  `id` varchar(128) NOT NULL,
  `pet_sbt_id` bigint NOT NULL,
  `vet_address` varchar(42) NOT NULL,
  `vet_name` varchar(256) NOT NULL,
  `owner_address` varchar(42) NOT NULL,
  `message` text,
  `requested_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vet_connection_requests`
--

LOCK TABLES `vet_connection_requests` WRITE;
/*!40000 ALTER TABLE `vet_connection_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `vet_connection_requests` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-10 14:43:30
