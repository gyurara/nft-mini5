const express = require('express');
const cors = require('cors');
const { createPetServiceApp, InMemoryPetProfileRepository, AppError } = require('./logic/src');

const PORT = process.env.PORT || 4000;
const repository = new InMemoryPetProfileRepository();
const tokenStateStore = new Map();

const sessionGateway = {
  async assertConnected(account) {
    if (!account) {
      throw new AppError('ACCOUNT_REQUIRED', '지갑 계정이 필요합니다.', { account });
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

const service = createPetServiceApp({
  sessionGateway,
  contractGateway,
  petProfileRepository: repository,
});

const app = express();
app.use(cors());
app.use(express.json());

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

function handleError(error, res) {
  const status = error instanceof AppError ? 400 : 500;
  res.status(status).json({
    code: error.code || 'INTERNAL_ERROR',
    message: error.message || '서버 오류가 발생했습니다.',
    meta: error.meta || null,
  });
}

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
