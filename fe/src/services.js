import { useState, useRef, useCallback } from "react";
import { ethers } from 'ethers';

/* ───────────── 에러 ───────────── */
export class AppError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

export function toAppError(error, fallbackCode, fallbackMessage, details = {}) {
  if (error instanceof AppError) return error;
  return new AppError(
    fallbackCode,
    error?.message || fallbackMessage,
    { ...details, cause: error?.message || String(error) },
  );
}

/* ───────────── 유효성 검사 ───────────── */
function requireNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError('INVALID_PET_INPUT', `${fieldName}은(는) 필수 입력값입니다.`, { field: fieldName });
  }
  return value.trim();
}

export function validatePetInput(input) {
  if (!input || typeof input !== 'object') {
    throw new AppError('INVALID_PET_INPUT', '반려동물 등록 정보가 필요합니다.');
  }
  if (!input.adoptDate) throw new AppError('INVALID_PET_INPUT', '입양일은 필수입니다.');
  return {
    account: requireNonEmptyString(input.account, 'account'),
    name: requireNonEmptyString(input.name, 'name'),
    species: requireNonEmptyString(input.species, 'species'),
    gender: input.gender || null,
    birthDate: input.birthDate || null,
    adoptDate: input.adoptDate,
    imageUrl: input.imageUrl || null,
  };
}

/* ───────────── receipt ───────────── */
export function extractTokenId(mintResult, expectedEventName) {
  if (!mintResult || typeof mintResult !== 'object') {
    throw new AppError('INVALID_RECEIPT', 'mint 결과가 비어 있습니다.');
  }
  if (mintResult.tokenId !== undefined && mintResult.tokenId !== null) {
    return Number(mintResult.tokenId);
  }
  const events = Array.isArray(mintResult.events)
    ? mintResult.events
    : Array.isArray(mintResult.receipt?.events)
    ? mintResult.receipt.events
    : [];
  const event = events.find(c => c?.eventName === expectedEventName || c?.name === expectedEventName);
  const rawTokenId = event?.tokenId ?? event?.args?.tokenId ?? event?.args?.[1];
  if (rawTokenId === undefined || rawTokenId === null) {
    throw new AppError('INVALID_RECEIPT', `${expectedEventName} 이벤트에서 tokenId를 찾을 수 없습니다.`);
  }
  return Number(rawTokenId);
}

/* ───────────── tokenUri ───────────── */
function sanitizeSegment(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || 'unknown';
}

export function createTokenUriFactory(baseUrl = 'https://mock.example.com/pet') {
  return {
    createSbtTokenUri({ account, pet }) {
      return `${baseUrl}/sbt/${sanitizeSegment(account)}/${sanitizeSegment(pet.id)}`;
    },
    createNftTokenUri({ account, pet }) {
      return `${baseUrl}/nft/${sanitizeSegment(account)}/${sanitizeSegment(pet.id)}`;
    },
    createMetadataRecord({ kind, tokenId, pet }) {
      return {
        url: `${baseUrl}/${kind}/${tokenId}`,
        metadata: {
          name: `Pet #${tokenId}`,
          description: kind === 'sbt' ? '반려동물 신원 SBT' : '반려동물 NFT',
          image: pet.imageUrl || 'https://placekitten.com/400/400',
          attributes: [
            { trait_type: '종', value: pet.species },
            { trait_type: '생년월일', value: pet.birthDate },
            { trait_type: '이름', value: pet.name },
          ],
        },
      };
    },
  };
}

/* ───────────── Repository ───────────── */
function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export class InMemoryPetProfileRepository {
  constructor() {
    this.petProfiles = new Map();
    this.transactions = new Map();
  }
  savePetProfile(profile) {
    const list = this.petProfiles.get(profile.account) || [];
    const idx = list.findIndex(p => p.pet.id === profile.pet.id);
    if (idx >= 0) list[idx] = deepClone(profile);
    else list.push(deepClone(profile));
    this.petProfiles.set(profile.account, list);
    return deepClone(profile);
  }
  getPetProfileByAccount(account) {
    const list = this.petProfiles.get(account) || [];
    return list.length > 0 ? deepClone(list[0]) : null;
  }
  getAllProfilesByAccount(account) {
    return deepClone(this.petProfiles.get(account) || []);
  }
  getProfileByPetId(account, petId) {
    const list = this.petProfiles.get(account) || [];
    const p = list.find(p => p.pet.id === petId);
    return p ? deepClone(p) : null;
  }
  saveSbtIssuance(account, issuance, petId) {
    const list = this.petProfiles.get(account) || [];
    const target = petId ? list.find(p => p.pet.id === petId) : list[0];
    if (!target) throw new Error('프로필을 찾을 수 없습니다.');
    target.sbt = deepClone(issuance);
    this.petProfiles.set(account, list);
    return deepClone(target);
  }
  appendNftIssuance(account, issuance, petId) {
    const list = this.petProfiles.get(account) || [];
    const target = petId ? list.find(p => p.pet.id === petId) : list[0];
    if (!target) throw new Error('프로필을 찾을 수 없습니다.');
    target.nfts = Array.isArray(target.nfts) ? target.nfts : [];
    target.nfts.push(deepClone(issuance));
    this.petProfiles.set(account, list);
    return deepClone(target);
  }
  saveTransaction(account, kind, transaction) {
    const key = `${account}:${kind}`;
    this.transactions.set(key, deepClone(transaction));
    return deepClone(transaction);
  }
  getLatestTransaction(account, kind) {
    const key = `${account}:${kind}`;
    const t = this.transactions.get(key);
    return t ? deepClone(t) : null;
  }
}

/* ───────────── 서비스들 ───────────── */
export function createRegisterPetService({ petProfileRepository }) {
  return {
    async execute(input) {
      const pet = validatePetInput(input);
      const now = new Date().toISOString();
      const profile = {
        account: pet.account,
        pet: {
          id: crypto.randomUUID(),
          name: pet.name,
          species: pet.species,
          gender: pet.gender || null,
          birthDate: pet.birthDate || null,
          adoptDate: pet.adoptDate,
          imageUrl: pet.imageUrl || null,
          createdAt: now,
          updatedAt: now,
        },
        sbt: null,
        nfts: [],
      };
      return petProfileRepository.savePetProfile(profile);
    },
  };
}

export function createIssueSbtService({ sessionGateway, contractGateway, petProfileRepository, tokenUriFactory }) {
  return {
    async execute(account, petId) {
      await sessionGateway.assertConnected(account);
      const profile = petId
        ? await petProfileRepository.getProfileByPetId(account, petId)
        : await petProfileRepository.getPetProfileByAccount(account);
      if (!profile?.pet) throw new AppError('PET_PROFILE_REQUIRED', 'SBT 발급 전 반려동물 등록이 필요합니다.', { account });
      if (profile.sbt) throw new AppError('SBT_ALREADY_ISSUED', '이 반려동물은 이미 SBT를 보유하고 있습니다.', { account });

      const pendingTransaction = await petProfileRepository.saveTransaction(account, 'sbt', {
        kind: 'sbt', status: 'pending', startedAt: new Date().toISOString(),
      });

      try {
        const requestTokenUri = tokenUriFactory.createSbtTokenUri({ account, pet: profile.pet });
        const mintResult = await contractGateway.mintSbt({ account, tokenUri: requestTokenUri });
        const tokenId = extractTokenId(mintResult, 'SBTMinted');
        const metadataRecord = tokenUriFactory.createMetadataRecord({ kind: 'sbt', tokenId, pet: profile.pet });
        const refreshedTokenState = await sessionGateway.refreshTokenState(account);

        await petProfileRepository.saveSbtIssuance(account, {
          tokenId, requestTokenUri,
          resolvedTokenUri: metadataRecord.url,
          metadata: metadataRecord.metadata,
          transactionHash: mintResult.hash || mintResult.receipt?.hash || null,
          mintedAt: new Date().toISOString(),
        }, profile.pet.id);

        const completedTransaction = await petProfileRepository.saveTransaction(account, 'sbt', {
          ...pendingTransaction, status: 'success',
          completedAt: new Date().toISOString(), tokenId,
          transactionHash: mintResult.hash || mintResult.receipt?.hash || null,
        });

        return {
          transaction: completedTransaction,
          tokenState: refreshedTokenState,
          issuance: await petProfileRepository.getProfileByPetId(account, profile.pet.id),
          nftCouponsGranted: 3,
        };
      } catch (error) {
        const appError = toAppError(error, 'SBT_MINT_FAILED', 'SBT 발급에 실패했습니다.', { account });
        await petProfileRepository.saveTransaction(account, 'sbt', {
          ...pendingTransaction, status: 'failed', completedAt: new Date().toISOString(),
          error: { code: appError.code, message: appError.message },
        });
        throw appError;
      }
    },
  };
}

export function createIssueNftService({ sessionGateway, contractGateway, petProfileRepository, tokenUriFactory }) {
  return {
    async execute(account, nftData = {}, petId) {
      await sessionGateway.assertConnected(account);
      const profile = petId
        ? await petProfileRepository.getProfileByPetId(account, petId)
        : await petProfileRepository.getPetProfileByAccount(account);
      if (!profile?.pet) throw new AppError('PET_PROFILE_REQUIRED', 'NFT 발급 전 반려동물 등록이 필요합니다.', { account });
      if (!profile.sbt) throw new AppError('SBT_REQUIRED', 'SBT 보유자만 NFT를 발급할 수 있습니다.', { account });

      const pendingTransaction = await petProfileRepository.saveTransaction(account, 'nft', {
        kind: 'nft', status: 'pending', startedAt: new Date().toISOString(),
      });

      try {
        const requestTokenUri = tokenUriFactory.createNftTokenUri({ account, pet: profile.pet });
        const mintResult = await contractGateway.mintNft({ account, tokenUri: requestTokenUri });
        const tokenId = extractTokenId(mintResult, 'NFTMinted');
        // ★ 이미지 데이터 포함하여 저장
        const petWithNftData = { ...profile.pet, imageUrl: nftData.imageUrl || profile.pet.imageUrl };
        const metadataRecord = tokenUriFactory.createMetadataRecord({ kind: 'nft', tokenId, pet: petWithNftData });
        const refreshedTokenState = await sessionGateway.refreshTokenState(account);

        await petProfileRepository.appendNftIssuance(account, {
          tokenId, requestTokenUri,
          resolvedTokenUri: metadataRecord.url,
          metadata: metadataRecord.metadata,
          transactionHash: mintResult.hash || mintResult.receipt?.hash || null,
          mintedAt: new Date().toISOString(),
          nftImageUrl: nftData.imageUrl || null,
          nftDescription: nftData.description || null,
        }, profile.pet.id);

        const completedTransaction = await petProfileRepository.saveTransaction(account, 'nft', {
          ...pendingTransaction, status: 'success',
          completedAt: new Date().toISOString(), tokenId,
          transactionHash: mintResult.hash || mintResult.receipt?.hash || null,
        });

        return {
          transaction: completedTransaction,
          tokenState: refreshedTokenState,
          issuance: await petProfileRepository.getProfileByPetId(account, profile.pet.id),
          goodsCouponGranted: 1,
          nftCouponConsumed: 1,
        };
      } catch (error) {
        const appError = toAppError(error, 'NFT_MINT_FAILED', 'NFT 발급에 실패했습니다.', { account });
        await petProfileRepository.saveTransaction(account, 'nft', {
          ...pendingTransaction, status: 'failed', completedAt: new Date().toISOString(),
          error: { code: appError.code, message: appError.message },
        });
        throw appError;
      }
    },
  };
}

export function createGetMyPageService({ sessionGateway, petProfileRepository }) {
  return {
    async execute(account) {
      const tokenState = await sessionGateway.getTokenState(account);
      const profile = await petProfileRepository.getPetProfileByAccount(account);
      return {
        account,
        pet: profile?.pet || null,
        holdings: tokenState,
        sbt: profile?.sbt || null,
        nfts: profile?.nfts || [],
        controls: {
          canIssueSbt: !tokenState.hasSbt,
          canIssueNft: tokenState.hasSbt,
          canAccessHolderBenefits: tokenState.hasNft,
        },
      };
    },
  };
}

export function createGetGoodsPreviewService({ sessionGateway }) {
  return {
    async execute(account) {
      const tokenState = await sessionGateway.getTokenState(account);
      const canPreview = Boolean(tokenState.hasNft);
      return {
        enabled: canPreview,
        reason: canPreview ? null : 'NFT 보유자만 굿즈 미리보기를 사용할 수 있습니다.',
        previewImageUrl: canPreview ? 'https://placekitten.com/600/600' : null,
        ctaLabel: '제작하기',
        canOrder: false,
      };
    },
  };
}

/* ───────────── 블록체인 게이트웨이 ───────────── */
const PET_SBT_ADDRESS = '0x149c3A733A5344B3F39361930A90B7E384F9D8E8';
const MEMORY_NFT_ADDRESS = '0x3fB61aC6C00c58092E418b4E7bC1B0Cfea72eb2d';
const MEDICAL_PASSPORT_ADDRESS = '0x3885d03aFccCE567BddD6415CCafe4483f4646c6';

export async function createRealGateways() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const petSBT = new ethers.Contract(PET_SBT_ADDRESS, [
    'function registerPet(string tokenURI) returns (uint256)',
    'function hasPetSBT(address owner) view returns (bool)',
    'function getPetTokenIds(address owner) view returns (uint256[])',
    'event PetRegistered(address indexed owner, uint256 indexed tokenId, string tokenURI)',
  ], signer);

  const medicalPassport = new ethers.Contract(MEDICAL_PASSPORT_ADDRESS, [
  'function mintMedicalPassport(uint256 ownerSbtId, string initialSummaryURI) returns (uint256)',
  'function appendMedicalRecord(uint256 medicalSbtId, string recordURI, bytes32 dataHash, uint64 visitDate, uint32 schemaVersion, string updatedSummaryURI) returns (uint256)',
  'function grantHospitalPermission(uint256 medicalSbtId, address hospital, uint64 validUntil, uint32 remainingWrites)',
  'function revokeHospitalPermission(uint256 medicalSbtId, address hospital)',
  'function getPassportInfo(uint256 medicalSbtId) view returns (tuple(uint256 linkedOwnerSbtId, uint64 createdAt, uint64 lastVisitDate, uint32 latestSchemaVersion, uint32 totalRecords))',
  'function getRecord(uint256 medicalSbtId, uint256 recordIndex) view returns (tuple(address hospital, string recordURI, bytes32 dataHash, uint64 visitDate, uint32 schemaVersion, uint64 createdAt))',
  'function getRecordCount(uint256 medicalSbtId) view returns (uint256)',
  'function canAppendRecord(uint256 medicalSbtId, address hospital) view returns (bool)',
  'function medicalSbtByOwnerSbt(uint256 ownerSbtId) view returns (uint256)',
  // ↓ 이 줄 추가
  'function getPermission(uint256 medicalSbtId, address hospital) view returns (tuple(bool allowed, uint64 validUntil, uint32 remainingWrites))',
], signer);

  const memoryNFT = new ethers.Contract(MEMORY_NFT_ADDRESS, [
    'function mintMemoryNFT(uint256 petSbtId, string tokenURI) payable returns (uint256)',
    'function hasMemoryNFT(address owner) view returns (bool)',
    'function mintPrice() view returns (uint256)',
    'event MemoryNFTMinted(address indexed owner, uint256 indexed tokenId, uint256 indexed petSbtId, string tokenURI, uint256 paid)',
  ], signer);

  const sessionGateway = {
    async assertConnected(account) {
      if (!window.ethereum) throw new AppError('NOT_CONNECTED', 'MetaMask를 설치해주세요.');
      const accounts = await provider.listAccounts();
      if (!accounts.length) throw new AppError('NOT_CONNECTED', '지갑이 연결되어 있지 않습니다.');
    },
    async getTokenState(account) {
      const hasSbt = await petSBT.hasPetSBT(account);
      const hasNft = await memoryNFT.hasMemoryNFT(account);
      return { hasSbt, hasNft };
    },
    async refreshTokenState(account) { return this.getTokenState(account); },
  };

  const contractGateway = {
    async mintSbt({ account, tokenUri }) {
      const tx = await petSBT.registerPet(tokenUri);
      const receipt = await tx.wait();
      const event = receipt.logs
        .map(log => { try { return petSBT.interface.parseLog(log); } catch { return null; } })
        .find(e => e?.name === 'PetRegistered');
      const tokenId = event?.args?.tokenId;
      return { tokenId, hash: receipt.hash, events: [{ eventName: 'SBTMinted', args: { tokenId } }] };
    },
    async mintNft({ account, tokenUri }) {
      const petTokenIds = await petSBT.getPetTokenIds(account);
      const petSbtId = petTokenIds[0];
      const price = await memoryNFT.mintPrice();
      const tx = await memoryNFT.mintMemoryNFT(petSbtId, tokenUri, { value: price });
      const receipt = await tx.wait();
      const event = receipt.logs
        .map(log => { try { return memoryNFT.interface.parseLog(log); } catch { return null; } })
        .find(e => e?.name === 'MemoryNFTMinted');
      const tokenId = event?.args?.tokenId;
      return { tokenId, hash: receipt.hash, events: [{ eventName: 'NFTMinted', args: { tokenId } }] };
    },
  };

  return { sessionGateway, contractGateway, medicalPassport, petSBT };
}

/* ───────────── 교환권 상수 ───────────── */
export const UNLOCK_TIERS = [
  { id: 'shampoo',    name: '천연 샴푸',         emoji: '🧴', cost: 1, price: 24000,  desc: '저자극 천연 성분 · 200ml' },
  { id: 'snack',      name: '수제 간식 세트',    emoji: '🍖', cost: 2, price: 32000,  desc: '수제 닭가슴살 · 고구마 세트' },
  { id: 'feed',       name: '프리미엄 사료',     emoji: '🐾', cost: 3, price: 45000,  desc: '수의사 추천 전용 사료 1kg' },
  { id: 'bed',        name: '프리미엄 펫 침대',  emoji: '🛏️', cost: 5, price: 68000,  desc: '기억폼 소재 · 세탁 가능 커버' },
  { id: 'carrier',    name: '애견 이동가방',     emoji: '🎒', cost: 8, price: 85000,  desc: '항공 기내 반입 가능 · 소형견용' },
  { id: 'cattower',   name: '캣타워',            emoji: '🏰', cost: 10, price: 120000, desc: '5단 스크래처 캣타워 (조립식)' },
];

export const DISCOUNT_PER_COUPON = 1000;

/* ───────────── 커스텀 훅 ───────────── */
export function usePetServiceApp() {
  const [account, setAccount] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [activePetId, setActivePetId] = useState(null);
  const [tokenStates, setTokenStates] = useState({});

  // petId별 교환권 관리 { petId: number }
  const [nftCouponsMap, setNftCouponsMap] = useState({});
  const [goodsCouponsMap, setGoodsCouponsMap] = useState({});
  const [discountCoupons, setDiscountCoupons] = useState(0);
  const [couponHistory, setCouponHistory] = useState([]);
  // 진료기록 NFT교환권 하루 1개 제한: { petId: 'YYYY-MM-DD' }
  const [lastMedicalCouponDate, setLastMedicalCouponDate] = useState({});

  const appRef = useRef(null);
  const repositoryRef = useRef(new InMemoryPetProfileRepository());
  const tokenUriFactory = useRef(createTokenUriFactory());

  const activeProfile = profiles.find(p => p.pet.id === activePetId) || profiles[0] || null;
  const activeTokenState = (activePetId && tokenStates[activePetId]) || { hasSbt: false, hasNft: false };
  const activePetIdResolved = activePetId || activeProfile?.pet?.id;
  const nftCoupons = nftCouponsMap[activePetIdResolved] || 0;
  const goodsCoupons = goodsCouponsMap[activePetIdResolved] || 0;

  const getApp = useCallback(async () => {
    if (!appRef.current) {
      const { sessionGateway, contractGateway } = await createRealGateways();
      appRef.current = {
        registerPetService: createRegisterPetService({ petProfileRepository: repositoryRef.current }),
        issueSbtService: createIssueSbtService({
          sessionGateway, contractGateway,
          petProfileRepository: repositoryRef.current,
          tokenUriFactory: tokenUriFactory.current,
        }),
        issueNftService: createIssueNftService({
          sessionGateway, contractGateway,
          petProfileRepository: repositoryRef.current,
          tokenUriFactory: tokenUriFactory.current,
        }),
        getMyPageService: createGetMyPageService({ sessionGateway, petProfileRepository: repositoryRef.current }),
        getGoodsPreviewService: createGetGoodsPreviewService({ sessionGateway }),
      };
    }
    return appRef.current;
  }, []);

  const refreshProfiles = useCallback((acc) => {
    const all = repositoryRef.current.getAllProfilesByAccount(acc);
    setProfiles(all);
    return all;
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) { alert('MetaMask를 설치해주세요.'); return; }
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const acc = accounts[0];
    setAccount(acc);
    setTokenStates({});
    refreshProfiles(acc);
    return acc;
  }, [refreshProfiles]);

  const disconnectWallet = useCallback(() => {
    setAccount(null); setProfiles([]); setActivePetId(null); setTokenStates({});
    setNftCouponsMap({}); setGoodsCouponsMap({}); setDiscountCoupons(0); setCouponHistory([]); setLastMedicalCouponDate({});
    repositoryRef.current = new InMemoryPetProfileRepository();
    appRef.current = null;
  }, []);

  const registerPet = useCallback(async (input) => {
    const app = await getApp();
    const result = await app.registerPetService.execute({ ...input, account });
    refreshProfiles(account);
    setActivePetId(result.pet.id);
    return result;
  }, [account, getApp, refreshProfiles]);

  const issueSbt = useCallback(async (petId) => {
    const app = await getApp();
    const targetId = petId || activePetId;
    const result = await app.issueSbtService.execute(account, targetId);
    const { sessionGateway } = await createRealGateways();
    const newTs = await sessionGateway.getTokenState(account);
    setTokenStates(prev => ({ ...prev, [targetId]: newTs }));
    refreshProfiles(account);

    if (result.nftCouponsGranted) {
      setNftCouponsMap(prev => ({ ...prev, [targetId]: (prev[targetId] || 0) + result.nftCouponsGranted }));
      setCouponHistory(prev => [{ id: Date.now(), type: 'nft', action: 'earn', amount: +result.nftCouponsGranted, desc: 'SBT 발급 보상', petId: targetId, date: new Date().toLocaleString() }, ...prev]);
    }
    return result;
  }, [account, activePetId, getApp, refreshProfiles]);

  const issueNft = useCallback(async (nftData = {}, petId) => {
    const targetNftCoupons = nftCouponsMap[petId || activePetId] || 0;
    if (targetNftCoupons < 1) throw new Error('NFT 교환권이 필요합니다.');
    const app = await getApp();
    const targetId = petId || activePetId;
    const result = await app.issueNftService.execute(account, nftData, targetId);
    const { sessionGateway } = await createRealGateways();
    const newTs = await sessionGateway.getTokenState(account);
    setTokenStates(prev => ({ ...prev, [targetId]: newTs }));
    refreshProfiles(account);

    setNftCouponsMap(prev => ({ ...prev, [targetId]: Math.max(0, (prev[targetId] || 0) - 1) }));
    if (result.goodsCouponGranted) {
      setGoodsCouponsMap(prev => ({ ...prev, [targetId]: (prev[targetId] || 0) + result.goodsCouponGranted }));
      setCouponHistory(prev => [{ id: Date.now(), type: 'goods', action: 'earn', amount: 1, desc: 'NFT 민팅 보상', petId: targetId, date: new Date().toLocaleString() }, ...prev]);
    }
    return result;
  }, [account, activePetId, getApp, refreshProfiles, nftCouponsMap]);

  // 의료 여권 발급
  const mintMedicalPassport = useCallback(async (petId) => {
    const { medicalPassport } = await createRealGateways();
    const profile = petId
      ? repositoryRef.current.getProfileByPetId(account, petId)
      : repositoryRef.current.getPetProfileByAccount(account);
    if (!profile?.sbt?.tokenId) throw new Error('SBT 토큰 ID가 없습니다. 먼저 SBT를 발급해주세요.');
    const ownerSbtId = profile.sbt.tokenId;
    const existing = await medicalPassport.medicalSbtByOwnerSbt(ownerSbtId);
    if (Number(existing) !== 0) throw new Error('이미 의료 여권이 발급되어 있습니다.');
    const summaryJson = JSON.stringify({
      name: `${profile.pet.name} Medical Passport`,
      description: 'Pet Medical Passport',
      petName: profile.pet.name,
      species: profile.pet.species,
    });
    const summaryURI = `data:application/json;base64,${btoa(unescape(encodeURIComponent(summaryJson)))}`;
    const tx = await medicalPassport.mintMedicalPassport(ownerSbtId, summaryURI);
    const receipt = await tx.wait();
    return { success: true, transactionHash: receipt.hash };
  }, [account]);

  // 진료기록 NFT교환권 지급 (하루 1개 제한)
  const addNftCouponFromMedical = useCallback((petId) => {
    const today = new Date().toISOString().split('T')[0];
    const lastDate = lastMedicalCouponDate[petId];
    if (lastDate === today) return { success: false, message: '오늘은 이미 진료 기록 NFT 교환권을 받았습니다.' };
    setNftCouponsMap(prev => ({ ...prev, [petId]: (prev[petId] || 0) + 1 }));
    setLastMedicalCouponDate(prev => ({ ...prev, [petId]: today }));
    setCouponHistory(prev => [{ id: Date.now(), type: 'nft', action: 'earn', amount: 1, desc: '진료 기록 보상 (하루 1회)', petId, date: new Date().toLocaleString() }, ...prev]);
    return { success: true };
  }, [lastMedicalCouponDate]);

  const redeemGoodsCoupon = useCallback((tierId) => {
    const tier = UNLOCK_TIERS.find(t => t.id === tierId);
    if (!tier) return { success: false, message: '존재하지 않는 굿즈입니다.' };
    const currentGoods = goodsCouponsMap[activePetIdResolved] || 0;
    if (currentGoods < tier.cost) return { success: false, message: `굿즈교환권이 ${tier.cost}개 필요합니다.` };
    setGoodsCouponsMap(prev => ({ ...prev, [activePetIdResolved]: Math.max(0, (prev[activePetIdResolved] || 0) - tier.cost) }));
    setCouponHistory(prev => [{ id: Date.now(), type: 'goods', action: 'use', amount: -tier.cost, desc: `${tier.name} 교환`, petId: activePetIdResolved, date: new Date().toLocaleString() }, ...prev]);
    return { success: true, message: `${tier.name} 교환 및 해금 완료!` };
  }, [goodsCouponsMap, activePetIdResolved]);

  return {
    state: {
      account, connected: !!account, profiles, profile: activeProfile, activePetId,
      tokenState: activeTokenState, tokenStates,
      nftCoupons: nftCoupons || 0, goodsCoupons: goodsCoupons || 0,
      nftCouponsMap, goodsCouponsMap,
      discountCoupons: discountCoupons || 0, couponHistory,
      unlockedGoods: UNLOCK_TIERS.map(tier => ({ ...tier, isAvailable: (goodsCoupons || 0) >= tier.cost }))
    },
    connectWallet, disconnectWallet, registerPet, issueSbt, issueNft, redeemGoodsCoupon, addNftCouponFromMedical, mintMedicalPassport, setActivePetId,
    getGoodsPreview: useCallback(async () => { const app = await getApp(); return app.getGoodsPreviewService.execute(account); }, [account, getApp])
  };
}