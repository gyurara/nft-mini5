function sanitizeSegment(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';
}

function createTokenUriFactory(baseUrl = 'https://mock.example.com/pet') {
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
          image: pet.image || 'https://placekitten.com/400/400',
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

module.exports = {
  createTokenUriFactory,
};
