const { randomUUID } = require('node:crypto');
const { validatePetInput } = require('../../shared/pet-validation');

function createRegisterPetService({ petProfileRepository }) {
  return {
    async execute(input) {
      const pet = validatePetInput(input);
      const now = new Date().toISOString();
      const existing = await petProfileRepository.getPetProfileByAccount(pet.account);

      const profile = {
        account: pet.account,
        pet: {
          id: existing?.pet?.id || randomUUID(),
          name: pet.name,
          species: pet.species,
          birthDate: pet.birthDate,
          createdAt: existing?.pet?.createdAt || now,
          updatedAt: now,
        },
        sbt: existing?.sbt || null,
        nfts: existing?.nfts || [],
      };

      return petProfileRepository.savePetProfile(profile);
    },
  };
}

module.exports = {
  createRegisterPetService,
};
