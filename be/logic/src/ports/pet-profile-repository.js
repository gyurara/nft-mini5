function assertPetProfileRepository(repository) {
  const required = [
    'savePetProfile',
    'getPetProfileByAccount',
    'saveSbtIssuance',
    'appendNftIssuance',
    'saveTransaction',
    'getLatestTransaction',
  ];

  for (const method of required) {
    if (typeof repository?.[method] !== 'function') {
      throw new Error(`petProfileRepository는 ${method} 메서드를 제공해야 합니다.`);
    }
  }
}

module.exports = {
  assertPetProfileRepository,
};
