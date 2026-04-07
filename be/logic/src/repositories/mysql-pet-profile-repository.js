const mysql = require('mysql2/promise');

class MySqlPetProfileRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async savePetProfile(profile) {
    const { account, pet, sbt, nfts } = profile;
    await this.pool.execute(
      `INSERT INTO pet_profiles (account, pet, sbt, nfts)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE pet = VALUES(pet), sbt = VALUES(sbt), nfts = VALUES(nfts)`,
      [account, JSON.stringify(pet), JSON.stringify(sbt), JSON.stringify(nfts)]
    );
    return this.getPetProfileByAccount(account);
  }

  async getPetProfileByAccount(account) {
    const [rows] = await this.pool.execute(
      'SELECT account, pet, sbt, nfts, nft_count FROM pet_profiles WHERE account = ?',
      [account]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      account: row.account,
      pet: JSON.parse(row.pet),
      sbt: row.sbt ? JSON.parse(row.sbt) : null,
      nfts: row.nfts ? JSON.parse(row.nfts) : [],
      nftCount: row.nft_count || 0,
    };
  }

  async saveSbtIssuance(account, issuance) {
    const profile = await this._getRequiredProfile(account);
    profile.sbt = issuance;
    return this.savePetProfile(profile);
  }

  async appendNftIssuance(account, issuance) {
    const profile = await this._getRequiredProfile(account);
    profile.nfts = Array.isArray(profile.nfts) ? profile.nfts : [];
    profile.nfts.push(issuance);
    return this.savePetProfile(profile);
  }

  // 온체인 SBT 민팅 결과를 DB에 동기화
  async syncSbt(account, sbtData) {
    const profile = await this.getPetProfileByAccount(account);
    if (!profile) {
      throw new Error(`등록된 반려동물 프로필이 없습니다: ${account}`);
    }
    await this.pool.execute(
      'UPDATE pet_profiles SET sbt = ? WHERE account = ?',
      [JSON.stringify(sbtData), account]
    );
    return this.getPetProfileByAccount(account);
  }

  // 온체인 NFT 민팅 결과를 DB에 동기화 + nft_count 증가
  async syncNft(account, nftData) {
    const profile = await this.getPetProfileByAccount(account);
    if (!profile) {
      throw new Error(`등록된 반려동물 프로필이 없습니다: ${account}`);
    }
    const nfts = Array.isArray(profile.nfts) ? profile.nfts : [];
    nfts.push(nftData);
    await this.pool.execute(
      'UPDATE pet_profiles SET nfts = ?, nft_count = nft_count + 1 WHERE account = ?',
      [JSON.stringify(nfts), account]
    );
    return this.getPetProfileByAccount(account);
  }

  // 할인권 교환 시 nft_count 차감
  async decrementNftCount(account) {
    const [rows] = await this.pool.execute(
      'SELECT nft_count FROM pet_profiles WHERE account = ?',
      [account]
    );
    if (rows.length === 0 || rows[0].nft_count <= 0) {
      throw new Error('NFT 보유량이 부족합니다.');
    }
    await this.pool.execute(
      'UPDATE pet_profiles SET nft_count = nft_count - 1 WHERE account = ? AND nft_count > 0',
      [account]
    );
  }

  async saveTransaction(account, kind, transaction) {
    await this.pool.execute(
      `INSERT INTO pet_transactions (account, kind, data)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE data = VALUES(data)`,
      [account, kind, JSON.stringify(transaction)]
    );
    return transaction;
  }

  async getLatestTransaction(account, kind) {
    const [rows] = await this.pool.execute(
      'SELECT data FROM pet_transactions WHERE account = ? AND kind = ?',
      [account, kind]
    );
    if (rows.length === 0) return null;
    return JSON.parse(rows[0].data);
  }

  async _getRequiredProfile(account) {
    const profile = await this.getPetProfileByAccount(account);
    if (!profile) {
      throw new Error(`등록된 반려동물 프로필이 없습니다: ${account}`);
    }
    return profile;
  }
}

async function createMySqlPool() {
  const dbName = process.env.DB_NAME || 'pawchain';

  const tempConn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4',
  });
  await tempConn.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4`);
  await tempConn.end();

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
  });

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS pet_profiles (
      account VARCHAR(42) PRIMARY KEY,
      pet JSON NOT NULL,
      sbt JSON,
      nfts JSON NOT NULL DEFAULT ('[]'),
      nft_count INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4
  `);

  // 기존 테이블에 nft_count 컬럼이 없으면 추가 (마이그레이션)
  try {
    await pool.execute(`ALTER TABLE pet_profiles ADD COLUMN nft_count INT NOT NULL DEFAULT 0`);
  } catch (e) {
    if (!e.message.includes('Duplicate column name')) throw e;
  }

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS pet_transactions (
      account VARCHAR(42) NOT NULL,
      kind VARCHAR(64) NOT NULL,
      data JSON NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (account, kind)
    ) CHARACTER SET utf8mb4
  `);

  // 병원 연결 승인 요청 (대기 중) - Node.js가 직접 관리
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS vet_connection_requests (
      id VARCHAR(128) PRIMARY KEY,
      pet_sbt_id BIGINT NOT NULL,
      vet_address VARCHAR(42) NOT NULL,
      vet_name VARCHAR(256) NOT NULL,
      owner_address VARCHAR(42) NOT NULL,
      message TEXT,
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4
  `);

  // 병원-보호자 승인된 연결 목록 - Node.js가 직접 관리
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS hospital_connections (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      owner_address VARCHAR(42) NOT NULL,
      vet_address VARCHAR(42) NOT NULL,
      pet_sbt_id BIGINT NOT NULL,
      connected TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_owner_vet (owner_address, vet_address)
    ) CHARACTER SET utf8mb4
  `);

  // 진료기록 메모 (Node.js 전용 - 암호화/SBT 민팅은 Spring Boot 담당)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS medical_records_simple (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      account VARCHAR(42) NOT NULL,
      pet_sbt_id BIGINT NOT NULL,
      record_type VARCHAR(80) NOT NULL,
      description TEXT NOT NULL,
      vet_address VARCHAR(42),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4
  `);

  // 통합 사용자 테이블 (일반 보호자 + 병원 계정)
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      role ENUM('USER', 'ORG') NOT NULL DEFAULT 'USER',
      name VARCHAR(100) NOT NULL,
      email VARCHAR(200) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      wallet_address VARCHAR(42),
      phone VARCHAR(20),
      license_number VARCHAR(50),
      location VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_email (email),
      UNIQUE KEY uk_wallet (wallet_address)
    ) CHARACTER SET utf8mb4
  `);

  return pool;
}

module.exports = {
  MySqlPetProfileRepository,
  createMySqlPool,
};
