const { AppError, toAppError } = require('../../shared/errors');
const { extractTokenId } = require('../../shared/receipt');

function createIssueNftService({ sessionGateway, contractGateway, petProfileRepository, tokenUriFactory }) {
  return {
    async execute(account) {
      await sessionGateway.assertConnected(account);
      const profile = await petProfileRepository.getPetProfileByAccount(account);

      if (!profile?.pet) {
        throw new AppError('PET_PROFILE_REQUIRED', 'NFT 발급 전 반려동물 등록이 필요합니다.', { account });
      }

      const tokenState = await sessionGateway.getTokenState(account);
      if (!tokenState.hasSbt) {
        throw new AppError('SBT_REQUIRED', 'SBT 보유자만 NFT를 발급할 수 있습니다.', { account });
      }

      const pendingTransaction = await petProfileRepository.saveTransaction(account, 'nft', {
        kind: 'nft',
        status: 'pending',
        startedAt: new Date().toISOString(),
      });

      try {
        const requestTokenUri = tokenUriFactory.createNftTokenUri({ account, pet: profile.pet });
        const mintResult = await contractGateway.mintNft({ account, tokenUri: requestTokenUri });
        const tokenId = extractTokenId(mintResult, 'NFTMinted');
        const metadataRecord = tokenUriFactory.createMetadataRecord({ kind: 'nft', tokenId, pet: profile.pet });
        const refreshedTokenState = await sessionGateway.refreshTokenState(account);

        await petProfileRepository.appendNftIssuance(account, {
          tokenId,
          requestTokenUri,
          resolvedTokenUri: metadataRecord.url,
          metadata: metadataRecord.metadata,
          transactionHash: mintResult.hash || mintResult.receipt?.hash || null,
          mintedAt: new Date().toISOString(),
        });

        const completedTransaction = await petProfileRepository.saveTransaction(account, 'nft', {
          ...pendingTransaction,
          status: 'success',
          completedAt: new Date().toISOString(),
          tokenId,
          transactionHash: mintResult.hash || mintResult.receipt?.hash || null,
        });

        return {
          transaction: completedTransaction,
          tokenState: refreshedTokenState,
          issuance: await petProfileRepository.getPetProfileByAccount(account),
        };
      } catch (error) {
        const appError = toAppError(error, 'NFT_MINT_FAILED', 'NFT 발급에 실패했습니다.', { account });
        await petProfileRepository.saveTransaction(account, 'nft', {
          ...pendingTransaction,
          status: 'failed',
          completedAt: new Date().toISOString(),
          error: {
            code: appError.code,
            message: appError.message,
          },
        });
        throw appError;
      }
    },
  };
}

module.exports = {
  createIssueNftService,
};
