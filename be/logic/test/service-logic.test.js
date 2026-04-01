const test = require('node:test');
const assert = require('node:assert/strict');
const { createPetServiceApp, AppError } = require('../src');

function createFakeSessionGateway(initialState = {}) {
  const state = new Map(Object.entries(initialState));

  function getOrCreate(account) {
    if (!state.has(account)) {
      state.set(account, {
        connected: true,
        hasSbt: false,
        hasNft: false,
        nftBalance: 0,
      });
    }

    return state.get(account);
  }

  return {
    async assertConnected(account) {
      const session = getOrCreate(account);
      if (!session.connected) {
        throw new AppError('WALLET_NOT_CONNECTED', '지갑이 연결되어 있지 않습니다.', { account });
      }
    },
    async getTokenState(account) {
      const { hasSbt, hasNft, nftBalance } = getOrCreate(account);
      return { hasSbt, hasNft, nftBalance };
    },
    async refreshTokenState(account) {
      return this.getTokenState(account);
    },
    grantSbt(account) {
      const session = getOrCreate(account);
      session.hasSbt = true;
    },
    grantNft(account) {
      const session = getOrCreate(account);
      session.hasNft = true;
      session.nftBalance += 1;
    },
    disconnect(account) {
      const session = getOrCreate(account);
      session.connected = false;
    },
  };
}

function createFakeContractGateway({ sessionGateway }) {
  let sbtTokenId = 1;
  let nftTokenId = 100;

  return {
    async mintSbt({ account, tokenUri }) {
      sessionGateway.grantSbt(account);
      return {
        hash: `0xsbt${sbtTokenId}`,
        tokenId: sbtTokenId++,
        eventName: 'SBTMinted',
        tokenUri,
      };
    },
    async mintNft({ account, tokenUri }) {
      sessionGateway.grantNft(account);
      return {
        hash: `0xnft${nftTokenId}`,
        tokenId: nftTokenId++,
        eventName: 'NFTMinted',
        tokenUri,
      };
    },
  };
}

test('반려동물 등록 후 SBT/NFT 발급과 마이페이지 조회가 동작한다', async () => {
  const account = '0xabc123';
  const sessionGateway = createFakeSessionGateway({
    [account]: { connected: true, hasSbt: false, hasNft: false, nftBalance: 0 },
  });
  const contractGateway = createFakeContractGateway({ sessionGateway });
  const app = createPetServiceApp({ sessionGateway, contractGateway });

  const profile = await app.registerPet({
    account,
    name: '나비',
    species: '고양이',
    birthDate: '2023-01-01',
  });

  assert.equal(profile.pet.name, '나비');
  assert.equal(profile.sbt, null);
  assert.deepEqual(profile.nfts, []);

  const sbtResult = await app.issueSbt(account);
  assert.equal(sbtResult.transaction.status, 'success');
  assert.equal(sbtResult.transaction.tokenId, 1);
  assert.equal(sbtResult.tokenState.hasSbt, true);

  const nftResult = await app.issueNft(account);
  assert.equal(nftResult.transaction.status, 'success');
  assert.equal(nftResult.transaction.tokenId, 100);
  assert.equal(nftResult.tokenState.hasNft, true);
  assert.equal(nftResult.tokenState.nftBalance, 1);

  const myPage = await app.getMyPage(account);
  assert.equal(myPage.pet.name, '나비');
  assert.equal(myPage.holdings.hasSbt, true);
  assert.equal(myPage.holdings.hasNft, true);
  assert.equal(myPage.holdings.nftBalance, 1);
  assert.equal(myPage.controls.canAccessHolderBenefits, true);
  assert.equal(myPage.sbt.tokenId, 1);
  assert.equal(myPage.nfts.length, 1);

  const goodsPreview = await app.getGoodsPreview(account);
  assert.equal(goodsPreview.enabled, true);
  assert.ok(goodsPreview.previewImageUrl);
});

test('SBT 없이 NFT를 발급하려고 하면 차단된다', async () => {
  const account = '0xno-sbt';
  const sessionGateway = createFakeSessionGateway({
    [account]: { connected: true, hasSbt: false, hasNft: false, nftBalance: 0 },
  });
  const contractGateway = createFakeContractGateway({ sessionGateway });
  const app = createPetServiceApp({ sessionGateway, contractGateway });

  await app.registerPet({
    account,
    name: '초코',
    species: '강아지',
    birthDate: '2022-02-02',
  });

  await assert.rejects(() => app.issueNft(account), (error) => {
    assert.equal(error.code, 'SBT_REQUIRED');
    return true;
  });

  const latest = await app.getLatestTransaction(account, 'nft');
  assert.equal(latest, null);
});

test('SBT 중복 발급 시도는 사전 차단된다', async () => {
  const account = '0xdup';
  const sessionGateway = createFakeSessionGateway({
    [account]: { connected: true, hasSbt: false, hasNft: false, nftBalance: 0 },
  });
  const contractGateway = createFakeContractGateway({ sessionGateway });
  const app = createPetServiceApp({ sessionGateway, contractGateway });

  await app.registerPet({
    account,
    name: '보리',
    species: '고양이',
    birthDate: '2021-03-03',
  });

  await app.issueSbt(account);

  await assert.rejects(() => app.issueSbt(account), (error) => {
    assert.equal(error.code, 'SBT_ALREADY_ISSUED');
    return true;
  });

  const latest = await app.getLatestTransaction(account, 'sbt');
  assert.equal(latest.status, 'success');
  assert.equal(latest.tokenId, 1);
});

test('지갑이 연결되지 않으면 발급 요청이 실패한다', async () => {
  const account = '0xoffline';
  const sessionGateway = createFakeSessionGateway({
    [account]: { connected: true, hasSbt: false, hasNft: false, nftBalance: 0 },
  });
  const contractGateway = createFakeContractGateway({ sessionGateway });
  const app = createPetServiceApp({ sessionGateway, contractGateway });

  await app.registerPet({
    account,
    name: '콩이',
    species: '강아지',
    birthDate: '2020-04-04',
  });

  sessionGateway.disconnect(account);

  await assert.rejects(() => app.issueSbt(account), (error) => {
    assert.equal(error.code, 'WALLET_NOT_CONNECTED');
    return true;
  });
});

test('컨트랙트 mint 실패 시 실패 상태가 저장된다', async () => {
  const account = '0xfail';
  const sessionGateway = createFakeSessionGateway({
    [account]: { connected: true, hasSbt: true, hasNft: false, nftBalance: 0 },
  });
  const contractGateway = {
    async mintSbt() {
      throw new Error('unexpected');
    },
    async mintNft() {
      throw new Error('max supply exceeded');
    },
  };
  const app = createPetServiceApp({ sessionGateway, contractGateway });

  await app.registerPet({
    account,
    name: '루비',
    species: '고양이',
    birthDate: '2020-05-05',
  });

  await assert.rejects(() => app.issueNft(account), (error) => {
    assert.equal(error.code, 'NFT_MINT_FAILED');
    assert.match(error.message, /max supply exceeded/);
    return true;
  });

  const latest = await app.getLatestTransaction(account, 'nft');
  assert.equal(latest.status, 'failed');
  assert.equal(latest.error.code, 'NFT_MINT_FAILED');
  assert.match(latest.error.message, /max supply exceeded/);
});
