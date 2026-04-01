function createGetMyPageService({ sessionGateway, petProfileRepository }) {
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

module.exports = {
  createGetMyPageService,
};
