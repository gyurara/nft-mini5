const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || '요청에 실패했습니다.');
    err.code = data.code;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  registerPet(input) {
    return request('/register', { method: 'POST', body: JSON.stringify(input) });
  },
  syncSbt(input) {
    return request('/sync-sbt', { method: 'POST', body: JSON.stringify(input) });
  },
  syncNft(input) {
    return request('/sync-nft', { method: 'POST', body: JSON.stringify(input) });
  },
  issueSbt(account) {
    return request('/issue-sbt', { method: 'POST', body: JSON.stringify({ account }) });
  },
  issueNft(account) {
    return request('/issue-nft', { method: 'POST', body: JSON.stringify({ account }) });
  },
  getMyPage(account) {
    return request(`/my-page/${encodeURIComponent(account)}`);
  },
  getGoodsPreview(account) {
    return request(`/goods-preview/${encodeURIComponent(account)}`);
  },
  getTokenState(account) {
    return request(`/token-state/${encodeURIComponent(account)}`);
  },
};
