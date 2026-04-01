class InMemoryPetProfileRepository {
  constructor() {
    this.petProfiles = new Map();
    this.transactions = new Map();
  }

  savePetProfile(profile) {
    this.petProfiles.set(profile.account, deepClone(profile));
    return deepClone(profile);
  }

  getPetProfileByAccount(account) {
    const profile = this.petProfiles.get(account);
    return profile ? deepClone(profile) : null;
  }

  saveSbtIssuance(account, issuance) {
    const current = this.getRequiredProfile(account);
    current.sbt = deepClone(issuance);
    return this.savePetProfile(current);
  }

  appendNftIssuance(account, issuance) {
    const current = this.getRequiredProfile(account);
    current.nfts = Array.isArray(current.nfts) ? current.nfts : [];
    current.nfts.push(deepClone(issuance));
    return this.savePetProfile(current);
  }

  saveTransaction(account, kind, transaction) {
    const key = `${account}:${kind}`;
    this.transactions.set(key, deepClone(transaction));
    return deepClone(transaction);
  }

  getLatestTransaction(account, kind) {
    const key = `${account}:${kind}`;
    const transaction = this.transactions.get(key);
    return transaction ? deepClone(transaction) : null;
  }

  getRequiredProfile(account) {
    const profile = this.petProfiles.get(account);

    if (!profile) {
      throw new Error(`등록된 반려동물 프로필이 없습니다: ${account}`);
    }

    return deepClone(profile);
  }
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

module.exports = {
  InMemoryPetProfileRepository,
};
