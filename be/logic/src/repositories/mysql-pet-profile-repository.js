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
      'SELECT account, pet, sbt, nfts FROM pet_profiles WHERE account = ?',
      [account]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      account: row.account,
      pet: JSON.parse(row.pet),
      sbt: row.sbt ? JSON.parse(row.sbt) : null,
      nfts: row.nfts ? JSON.parse(row.nfts) : [],
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
  });
  await tempConn.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4`);
  await tempConn.end();

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    waitForConnections: true,
    connectionLimit: 10,
  });

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS pet_profiles (
      account VARCHAR(42) PRIMARY KEY,
      pet JSON NOT NULL,
      sbt JSON,
      nfts JSON NOT NULL DEFAULT ('[]'),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS pet_transactions (
      account VARCHAR(42) NOT NULL,
      kind VARCHAR(64) NOT NULL,
      data JSON NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (account, kind)
    ) CHARACTER SET utf8mb4
  `);

  return pool;
}

module.exports = {
  MySqlPetProfileRepository,
  createMySqlPool,
};
