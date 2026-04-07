const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
const ANIMAL_API_BASE = import.meta.env.VITE_ANIMAL_API_BASE_URL || 'http://localhost:8080/api';

async function request(baseUrl, path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'include', // 세션 쿠키 전달
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.error || '요청을 처리하지 못했습니다.');
    err.code = data.code;
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

function apiRequest(path, options) {
  return request(API_BASE, path, options);
}

function animalApiRequest(path, options) {
  return request(ANIMAL_API_BASE, path, options);
}

export const api = {
  // 지갑 연결 시 세션 자동 생성 (wallet-based login)
  walletLogin(walletAddress) {
    return request(API_BASE, '/auth/wallet-login', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
      credentials: 'include',
    });
  },
  walletLogout() {
    return request(API_BASE, '/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  },
  getMe() {
    return request(API_BASE, '/auth/me', { credentials: 'include' });
  },
  registerPet(input) {
    return apiRequest('/register', { method: 'POST', body: JSON.stringify(input) });
  },
  syncSbt(input) {
    return apiRequest('/sync-sbt', { method: 'POST', body: JSON.stringify(input) });
  },
  syncNft(input) {
    return apiRequest('/sync-nft', { method: 'POST', body: JSON.stringify(input) });
  },
  issueSbt(account) {
    return apiRequest('/issue-sbt', { method: 'POST', body: JSON.stringify({ account }) });
  },
  issueNft(account) {
    return apiRequest('/issue-nft', { method: 'POST', body: JSON.stringify({ account }) });
  },
  getMyPage(account) {
    return apiRequest(`/my-page/${encodeURIComponent(account)}`);
  },
  getGoodsPreview(account) {
    return apiRequest(`/goods-preview/${encodeURIComponent(account)}`);
  },
  getTokenState(account) {
    return apiRequest(`/token-state/${encodeURIComponent(account)}`);
  },
  useNftCoupon(account) {
    return apiRequest('/use-nft-coupon', { method: 'POST', body: JSON.stringify({ account }) });
  },
};

export const animalApi = {
  lookupRegistrationNumber(input) {
    return animalApiRequest('/animal/registration-number', { method: 'POST', body: JSON.stringify(input) });
  },
  mintSbt(input) {
    return animalApiRequest('/sbt/mint', { method: 'POST', body: JSON.stringify(input) });
  },
  hasSbt(ownerAddress) {
    return animalApiRequest(`/sbt/has/${encodeURIComponent(ownerAddress)}`);
  },
  approveVet(input) {
    return animalApiRequest('/sbt/approve-vet', { method: 'POST', body: JSON.stringify(input) });
  },
  revokeVet(input) {
    return animalApiRequest('/sbt/revoke-vet', { method: 'POST', body: JSON.stringify(input) });
  },
  addMedicalRecord(input) {
    return animalApiRequest('/record/add', { method: 'POST', body: JSON.stringify(input) });
  },
  getMedicalRecords(petSbtId) {
    return animalApiRequest(`/record/${encodeURIComponent(petSbtId)}`);
  },
  mintMemoryNft(input) {
    return animalApiRequest('/nft/mint-memory', { method: 'POST', body: JSON.stringify(input) });
  },
};
