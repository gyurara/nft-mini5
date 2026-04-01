const { assertSessionGateway } = require('../ports/session-gateway');
const { assertContractGateway } = require('../ports/contract-gateway');
const { assertPetProfileRepository } = require('../ports/pet-profile-repository');
const { InMemoryPetProfileRepository } = require('../repositories/in-memory-pet-profile-repository');
const { createTokenUriFactory } = require('../shared/token-uri');
const { createRegisterPetService } = require('../features/pet-registration/register-pet-service');
const { createIssueSbtService } = require('../features/sbt/issue-sbt-service');
const { createIssueNftService } = require('../features/nft/issue-nft-service');
const { createGetMyPageService } = require('../features/my-page/get-my-page-service');
const { createGetGoodsPreviewService } = require('../features/goods/get-goods-preview-service');

function createPetServiceApp({ sessionGateway, contractGateway, petProfileRepository, tokenUriFactory } = {}) {
  assertSessionGateway(sessionGateway);
  assertContractGateway(contractGateway);

  const repository = petProfileRepository || new InMemoryPetProfileRepository();
  assertPetProfileRepository(repository);

  const uriFactory = tokenUriFactory || createTokenUriFactory();

  const registerPetService = createRegisterPetService({ petProfileRepository: repository });
  const issueSbtService = createIssueSbtService({
    sessionGateway,
    contractGateway,
    petProfileRepository: repository,
    tokenUriFactory: uriFactory,
  });
  const issueNftService = createIssueNftService({
    sessionGateway,
    contractGateway,
    petProfileRepository: repository,
    tokenUriFactory: uriFactory,
  });
  const getMyPageService = createGetMyPageService({
    sessionGateway,
    petProfileRepository: repository,
  });
  const getGoodsPreviewService = createGetGoodsPreviewService({
    sessionGateway,
  });

  return {
    registerPet(input) {
      return registerPetService.execute(input);
    },
    issueSbt(account) {
      return issueSbtService.execute(account);
    },
    issueNft(account) {
      return issueNftService.execute(account);
    },
    getMyPage(account) {
      return getMyPageService.execute(account);
    },
    getGoodsPreview(account) {
      return getGoodsPreviewService.execute(account);
    },
    getLatestTransaction(account, kind) {
      return repository.getLatestTransaction(account, kind);
    },
  };
}

module.exports = {
  createPetServiceApp,
};
