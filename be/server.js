const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { createPetServiceApp, AppError } = require('./logic/src');
const { MySqlPetProfileRepository, createMySqlPool } = require('./logic/src/repositories/mysql-pet-profile-repository');

const PORT = process.env.PORT || 4000;
const SALT_ROUNDS = 10;
const tokenStateStore = new Map();

let dbPool = null;

// SSE: 보호자 주소별 HTTP 연결 관리 (in-memory)
const sseClients = new Map(); // ownerAddress -> res

// ─── SessionGateway / ContractGateway ────────────────────────────────────────

const sessionGateway = {
  async assertConnected(account) {
    if (!account) {
      throw new AppError('ACCOUNT_REQUIRED', '지갑 연결이 필요합니다.', { account });
    }
  },
  async getTokenState(account) {
    const state = tokenStateStore.get(account) || { hasSbt: false, hasNft: false, nftBalance: 0 };
    const normalized = {
      hasSbt: Boolean(state.hasSbt),
      nftBalance: Number(state.nftBalance || 0),
    };
    return { ...normalized, hasNft: normalized.nftBalance > 0 };
  },
  async refreshTokenState(account) {
    return this.getTokenState(account);
  },
};

let nextSbtId = 1;
let nextNftId = 1;
const contractGateway = {
  async mintSbt({ account }) {
    const tokenId = nextSbtId++;
    const prev = tokenStateStore.get(account) || { hasSbt: false, hasNft: false, nftBalance: 0 };
    tokenStateStore.set(account, { ...prev, hasSbt: true });
    return { hash: `0xsbt${tokenId}`, tokenId, eventName: 'SBTMinted' };
  },
  async mintNft({ account }) {
    const tokenId = nextNftId++;
    const prev = tokenStateStore.get(account) || { hasSbt: false, hasNft: false, nftBalance: 0 };
    const nftBalance = Number(prev.nftBalance || 0) + 1;
    tokenStateStore.set(account, { ...prev, hasNft: nftBalance > 0, nftBalance });
    return { hash: `0xnft${tokenId}`, tokenId, eventName: 'NFTMinted' };
  },
};

// ─── Express 앱 ───────────────────────────────────────────────────────────────

const app = express();

// CORS: 세션 쿠키를 쓰려면 credentials: true + 명시적 origin 필요
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'pawchain-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,          // HTTPS 환경이면 true로 변경
    maxAge: 24 * 60 * 60 * 1000, // 24시간
  },
}));

// ─── 인증 미들웨어 ─────────────────────────────────────────────────────────────

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' });
  }
  next();
}

function requireOrg(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' });
  }
  if (req.session.user.role !== 'ORG') {
    return res.status(403).json({ code: 'FORBIDDEN', message: '병원 계정만 접근 가능합니다.' });
  }
  next();
}

// ─── 인증 API ─────────────────────────────────────────────────────────────────

// 회원가입 (일반 / 병원 공용)
// POST /api/auth/register
// Body: { role, name, email, password, phone?, licenseNumber?, location? }
app.post('/api/auth/register', async (req, res) => {
  try {
    const { role, name, email, password, phone, licenseNumber, location } = req.body || {};

    if (!role || !name || !email || !password) {
      return res.status(400).json({ code: 'INVALID_PARAMS', message: 'role, name, email, password는 필수입니다.' });
    }
    if (!['USER', 'ORG'].includes(role)) {
      return res.status(400).json({ code: 'INVALID_PARAMS', message: 'role은 USER 또는 ORG이어야 합니다.' });
    }
    if (role === 'ORG' && !licenseNumber) {
      return res.status(400).json({ code: 'INVALID_PARAMS', message: '병원 계정은 면허번호(licenseNumber)가 필수입니다.' });
    }

    // 이메일 중복 확인
    const [existing] = await dbPool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ code: 'EMAIL_EXISTS', message: '이미 사용 중인 이메일입니다.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await dbPool.execute(
      `INSERT INTO users (role, name, email, password_hash, phone, license_number, location)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [role, name, email, passwordHash, phone || null, licenseNumber || null, location || null]
    );

    const userId = result.insertId;
    req.session.user = { id: userId, role, name, email, walletAddress: null };

    res.status(201).json({
      ok: true,
      user: { id: userId, role, name, email },
    });
  } catch (error) {
    handleError(error, res);
  }
});

// 로그인
// POST /api/auth/login
// Body: { email, password }
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ code: 'INVALID_PARAMS', message: 'email과 password는 필수입니다.' });
    }

    const [rows] = await dbPool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    req.session.user = {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      walletAddress: user.wallet_address || null,
    };

    res.json({
      ok: true,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        walletAddress: user.wallet_address || null,
      },
    });
  } catch (error) {
    handleError(error, res);
  }
});

// 로그아웃
// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ code: 'LOGOUT_FAILED', message: '로그아웃 실패' });
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// 현재 로그인 유저 정보
// GET /api/auth/me
app.get('/api/auth/me', requireLogin, (req, res) => {
  res.json({ user: req.session.user });
});

// 지갑 주소 연결/업데이트 (로그인 후 MetaMask 연결 시 호출)
// PUT /api/auth/wallet
// Body: { walletAddress }
app.put('/api/auth/wallet', requireLogin, async (req, res) => {
  try {
    const { walletAddress } = req.body || {};
    if (!walletAddress) {
      return res.status(400).json({ code: 'INVALID_PARAMS', message: 'walletAddress는 필수입니다.' });
    }

    const normalized = walletAddress.toLowerCase();

    // 다른 계정이 같은 지갑을 쓰고 있는지 확인
    const [dup] = await dbPool.execute(
      'SELECT id FROM users WHERE wallet_address = ? AND id != ?',
      [normalized, req.session.user.id]
    );
    if (dup.length > 0) {
      return res.status(409).json({ code: 'WALLET_EXISTS', message: '이미 다른 계정에 연결된 지갑 주소입니다.' });
    }

    await dbPool.execute(
      'UPDATE users SET wallet_address = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [normalized, req.session.user.id]
    );

    // 세션도 업데이트
    req.session.user.walletAddress = normalized;

    res.json({ ok: true, walletAddress: normalized });
  } catch (error) {
    handleError(error, res);
  }
});

// 이름으로 유저 검색 (병원이 보호자 지갑 주소 조회 시 사용)
// GET /api/users/search?name=홍길동
app.get('/api/users/search', requireLogin, async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || name.trim().length < 1) {
      return res.status(400).json({ code: 'INVALID_PARAMS', message: '검색어를 입력하세요.' });
    }

    const [rows] = await dbPool.execute(
      `SELECT id, role, name, wallet_address FROM users
       WHERE name LIKE ? AND role = 'USER'
       LIMIT 10`,
      [`%${name.trim()}%`]
    );

    res.json({
      users: rows.map((r) => ({
        id: r.id,
        name: r.name,
        walletAddress: r.wallet_address || null,
      })),
    });
  } catch (error) {
    handleError(error, res);
  }
});

// ─── 기존 펫 서비스 API ───────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/api/register', async (req, res) => {
  try {
    const result = await service.registerPet(req.body);
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
});

app.post('/api/issue-sbt', async (req, res) => {
  try {
    const { account } = req.body || {};
    const result = await service.issueSbt(account);
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
});

app.post('/api/issue-nft', async (req, res) => {
  try {
    const { account } = req.body || {};
    const result = await service.issueNft(account);
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
});

app.get('/api/my-page/:account', async (req, res) => {
  try {
    const { account } = req.params;
    const result = await service.getMyPage(account);
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
});

app.get('/api/goods-preview/:account', async (req, res) => {
  try {
    const { account } = req.params;
    const result = await service.getGoodsPreview(account);
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
});

app.get('/api/token-state/:account', async (req, res) => {
  try {
    const { account } = req.params;
    const result = await sessionGateway.getTokenState(account);
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
});

// ─── 병원 SSE / 승인 요청 API ─────────────────────────────────────────────────

// SSE: 보호자가 알림 구독 (로그인 필요)
app.get('/api/notifications/:ownerAddress', requireLogin, async (req, res) => {
  const ownerAddress = req.params.ownerAddress.toLowerCase();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (sseClients.has(ownerAddress)) {
    try { sseClients.get(ownerAddress).end(); } catch (_) {}
  }
  sseClients.set(ownerAddress, res);

  // 연결 시 DB에서 대기 중인 요청 즉시 전송
  try {
    const [pending] = await dbPool.execute(
      'SELECT * FROM vet_connection_requests WHERE owner_address = ? ORDER BY requested_at ASC',
      [ownerAddress]
    );
    for (const row of pending) {
      res.write(`data: ${JSON.stringify({
        type: 'VET_APPROVAL_REQUEST',
        id: row.id,
        petSbtId: row.pet_sbt_id,
        vetAddress: row.vet_address,
        vetName: row.vet_name,
        ownerAddress: row.owner_address,
        message: row.message || '',
        requestedAt: row.requested_at,
      })}\n\n`);
    }
  } catch (err) {
    console.error('SSE 대기 요청 로드 실패:', err.message);
  }

  req.on('close', () => sseClients.delete(ownerAddress));
});

// 병원이 연결 상태 확인
app.get('/api/vet/check-access/:ownerAddress/:vetAddress', requireLogin, async (req, res) => {
  try {
    const ownerAddress = req.params.ownerAddress.toLowerCase();
    const vetAddress = req.params.vetAddress.toLowerCase();
    const [rows] = await dbPool.execute(
      'SELECT connected FROM hospital_connections WHERE owner_address = ? AND vet_address = ?',
      [ownerAddress, vetAddress]
    );
    res.json({ connected: rows.length > 0 && rows[0].connected === 1 });
  } catch (error) {
    handleError(error, res);
  }
});

// 병원 → 보호자에게 승인 요청 전송
// vetAddress / vetName은 세션에서 자동으로 가져옴
// Body: { petSbtId, ownerAddress, message? }
app.post('/api/vet/request-approval', requireOrg, async (req, res) => {
  try {
    const { petSbtId, ownerAddress, message } = req.body || {};

    if (!petSbtId || !ownerAddress) {
      return res.status(400).json({ code: 'INVALID_PARAMS', message: 'petSbtId, ownerAddress는 필수입니다.' });
    }

    // 세션에서 병원 정보 가져오기
    const vetAddress = req.session.user.walletAddress;
    const vetName = req.session.user.name;

    if (!vetAddress) {
      return res.status(400).json({ code: 'WALLET_NOT_LINKED', message: '지갑 주소를 먼저 연결해주세요.' });
    }

    const normalizedOwner = ownerAddress.toLowerCase();
    const normalizedVet = vetAddress.toLowerCase();

    // 이미 연결된 병원이면 재요청 불필요
    const [existing] = await dbPool.execute(
      'SELECT connected FROM hospital_connections WHERE owner_address = ? AND vet_address = ?',
      [normalizedOwner, normalizedVet]
    );
    if (existing.length > 0 && existing[0].connected === 1) {
      return res.status(409).json({ code: 'ALREADY_CONNECTED', message: '이미 연결된 병원입니다.' });
    }

    const approvalId = `${normalizedVet}-${petSbtId}-${Date.now()}`;

    await dbPool.execute(
      `INSERT INTO vet_connection_requests (id, pet_sbt_id, vet_address, vet_name, owner_address, message)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE message = VALUES(message)`,
      [approvalId, petSbtId, normalizedVet, vetName, normalizedOwner, message || '']
    );

    const approval = {
      id: approvalId,
      petSbtId,
      vetAddress: normalizedVet,
      vetName,
      ownerAddress: normalizedOwner,
      message: message || '',
      requestedAt: new Date().toISOString(),
    };

    const clientRes = sseClients.get(normalizedOwner);
    if (clientRes) {
      clientRes.write(`data: ${JSON.stringify({ type: 'VET_APPROVAL_REQUEST', ...approval })}\n\n`);
    }

    res.json({ ok: true, approval });
  } catch (error) {
    handleError(error, res);
  }
});

// 보호자 → 병원 승인/거절 응답
// Body: { approvalId, ownerAddress, approved }
app.post('/api/vet/respond-approval', requireLogin, async (req, res) => {
  try {
    const { approvalId, ownerAddress, approved } = req.body || {};

    if (!approvalId || !ownerAddress || approved === undefined) {
      return res.status(400).json({ code: 'INVALID_PARAMS', message: 'approvalId, ownerAddress, approved는 필수입니다.' });
    }

    const normalizedOwner = ownerAddress.toLowerCase();
    const conn = await dbPool.getConnection();

    try {
      await conn.beginTransaction();

      const [rows] = await conn.execute(
        'SELECT * FROM vet_connection_requests WHERE id = ? AND owner_address = ?',
        [approvalId, normalizedOwner]
      );

      if (rows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ code: 'NOT_FOUND', message: '해당 승인 요청을 찾을 수 없습니다.' });
      }

      const approval = rows[0];

      await conn.execute('DELETE FROM vet_connection_requests WHERE id = ?', [approvalId]);

      if (approved) {
        await conn.execute(
          `INSERT INTO hospital_connections (owner_address, vet_address, pet_sbt_id, connected)
           VALUES (?, ?, ?, 1)
           ON DUPLICATE KEY UPDATE connected = 1, pet_sbt_id = VALUES(pet_sbt_id), updated_at = CURRENT_TIMESTAMP`,
          [normalizedOwner, approval.vet_address, approval.pet_sbt_id]
        );

        // Spring Boot pet_vet_approvals 동기화
        const txHash = '0x' + require('crypto').randomBytes(32).toString('hex').substring(0, 64) + '00';
        try {
          await conn.execute(
            `INSERT INTO pet_vet_approvals (pet_sbt_id, owner_address, vet_address, owner_signature, active, tx_hash, created_at, updated_at)
             VALUES (?, ?, ?, 'sse-approved', 1, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE active = 1, updated_at = NOW()`,
            [approval.pet_sbt_id, normalizedOwner, approval.vet_address, txHash]
          );
        } catch (syncErr) {
          console.warn('pet_vet_approvals 동기화 실패 (무시):', syncErr.message);
        }
      }

      await conn.commit();

      const clientRes = sseClients.get(normalizedOwner);
      if (clientRes) {
        clientRes.write(`data: ${JSON.stringify({
          type: 'VET_APPROVAL_RESULT',
          approvalId,
          approved,
          petSbtId: approval.pet_sbt_id,
          vetAddress: approval.vet_address,
        })}\n\n`);
      }

      res.json({
        ok: true,
        approved,
        approval: {
          id: approval.id,
          petSbtId: approval.pet_sbt_id,
          vetAddress: approval.vet_address,
          vetName: approval.vet_name,
          ownerAddress: approval.owner_address,
        },
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    handleError(error, res);
  }
});

// 대기 중인 승인 요청 목록 조회
app.get('/api/vet/pending-approvals/:ownerAddress', requireLogin, async (req, res) => {
  try {
    const ownerAddress = req.params.ownerAddress.toLowerCase();
    const [rows] = await dbPool.execute(
      'SELECT * FROM vet_connection_requests WHERE owner_address = ? ORDER BY requested_at ASC',
      [ownerAddress]
    );
    res.json({
      pending: rows.map((r) => ({
        id: r.id,
        petSbtId: r.pet_sbt_id,
        vetAddress: r.vet_address,
        vetName: r.vet_name,
        ownerAddress: r.owner_address,
        message: r.message || '',
        requestedAt: r.requested_at,
      })),
    });
  } catch (error) {
    handleError(error, res);
  }
});

// 승인된 병원 목록 조회
app.get('/api/vet/approved-vets/:ownerAddress', requireLogin, async (req, res) => {
  try {
    const ownerAddress = req.params.ownerAddress.toLowerCase();
    const [rows] = await dbPool.execute(
      'SELECT vet_address, pet_sbt_id, created_at FROM hospital_connections WHERE owner_address = ? AND connected = 1',
      [ownerAddress]
    );
    res.json({
      approvedVets: rows.map((r) => ({
        vetAddress: r.vet_address,
        petSbtId: r.pet_sbt_id,
        connectedAt: r.created_at,
      })),
    });
  } catch (error) {
    handleError(error, res);
  }
});

// 연결 끊기
app.delete('/api/vet/revoke/:ownerAddress/:vetAddress', requireLogin, async (req, res) => {
  try {
    const ownerAddress = req.params.ownerAddress.toLowerCase();
    const vetAddress = req.params.vetAddress.toLowerCase();

    const conn = await dbPool.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.execute(
        'SELECT id FROM hospital_connections WHERE owner_address = ? AND vet_address = ? AND connected = 1',
        [ownerAddress, vetAddress]
      );

      if (existing.length === 0) {
        await conn.rollback();
        return res.status(404).json({ code: 'NOT_FOUND', message: '승인된 병원이 아닙니다.' });
      }

      await conn.execute(
        'UPDATE hospital_connections SET connected = 0, updated_at = CURRENT_TIMESTAMP WHERE owner_address = ? AND vet_address = ?',
        [ownerAddress, vetAddress]
      );

      try {
        await conn.execute(
          'UPDATE pet_vet_approvals SET active = 0, updated_at = NOW() WHERE owner_address = ? AND vet_address = ?',
          [ownerAddress, vetAddress]
        );
      } catch (syncErr) {
        console.warn('pet_vet_approvals 비활성화 실패 (무시):', syncErr.message);
      }

      await conn.commit();

      const clientRes = sseClients.get(ownerAddress);
      if (clientRes) {
        clientRes.write(`data: ${JSON.stringify({ type: 'VET_REVOKED', vetAddress, ownerAddress })}\n\n`);
      }

      res.json({ ok: true, revokedVet: vetAddress });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    handleError(error, res);
  }
});

// ─── 진료기록 API ─────────────────────────────────────────────────────────────

app.post('/api/medical/save', requireLogin, async (req, res) => {
  try {
    const { account, petSbtId, recordType, description, vetAddress } = req.body || {};
    if (!account || !petSbtId || !recordType || !description) {
      return res.status(400).json({ code: 'INVALID_PARAMS', message: 'account, petSbtId, recordType, description은 필수입니다.' });
    }

    await dbPool.execute(
      `INSERT INTO medical_records_simple (account, pet_sbt_id, record_type, description, vet_address)
       VALUES (?, ?, ?, ?, ?)`,
      [account, petSbtId, recordType, description, vetAddress || null]
    );

    const [rows] = await dbPool.execute(
      'SELECT * FROM medical_records_simple WHERE account = ? AND pet_sbt_id = ? ORDER BY created_at DESC LIMIT 1',
      [account, petSbtId]
    );

    res.json({ ok: true, record: rows[0] });
  } catch (error) {
    handleError(error, res);
  }
});

app.get('/api/medical/:account/:petSbtId', requireLogin, async (req, res) => {
  try {
    const { account, petSbtId } = req.params;
    const [rows] = await dbPool.execute(
      'SELECT * FROM medical_records_simple WHERE account = ? AND pet_sbt_id = ? ORDER BY created_at DESC',
      [account, petSbtId]
    );
    res.json({ records: rows });
  } catch (error) {
    handleError(error, res);
  }
});

// ─── 에러 핸들러 / 서버 시작 ──────────────────────────────────────────────────

function handleError(error, res) {
  const status = error instanceof AppError ? 400 : 500;
  res.status(status).json({
    code: error.code || 'INTERNAL_ERROR',
    message: error.message || '서버 오류가 발생했습니다.',
    meta: error.meta || null,
  });
}

let service;

async function main() {
  const pool = await createMySqlPool();
  dbPool = pool;

  const repository = new MySqlPetProfileRepository(pool);

  service = createPetServiceApp({
    sessionGateway,
    contractGateway,
    petProfileRepository: repository,
  });

  app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('서버 시작 실패:', err);
  process.exit(1);
});
