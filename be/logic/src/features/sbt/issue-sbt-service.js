const { AppError, toAppError } = require('../../shared/errors');
const { extractTokenId } = require('../../shared/receipt');

function createIssueSbtService({ sessionGateway, contractGateway, petProfileRepository, tokenUriFactory }) {
  return {
    async execute(account) {
      await sessionGateway.assertConnected(account);
      const profile = await petProfileRepository.getPetProfileByAccount(account);

      if (!profile?.pet) {
        throw new AppError('PET_PROFILE_REQUIRED', 'SBT 발급 전 반려동물 등록이 필요합니다.', { account });
      }

      const tokenState = await sessionGateway.getTokenState(account);
      if (tokenState.hasSbt) {
        throw new AppError('SBT_ALREADY_ISSUED', '이미 SBT를 보유하고 있습니다.', { account });
      }

      const pendingTransaction = await petProfileRepository.saveTransaction(account, 'sbt', {
        kind: 'sbt',
        status: 'pending',
        startedAt: new Date().toISOString(),
      });

      try {
        const requestTokenUri = tokenUriFactory.createSbtTokenUri({ account, pet: profile.pet });
        const mintResult = await contractGateway.mintSbt({ account, tokenUri: requestTokenUri });
        const tokenId = extractTokenId(mintResult, 'SBTMinted');
        const metadataRecord = tokenUriFactory.createMetadataRecord({ kind: 'sbt', tokenId, pet: profile.pet });
        const refreshedTokenState = await sessionGateway.refreshTokenState(account);

        await petProfileRepository.saveSbtIssuance(account, {
          tokenId,
          requestTokenUri,
          resolvedTokenUri: metadataRecord.url,
          metadata: metadataRecord.metadata,
          transactionHash: mintResult.hash || mintResult.receipt?.hash || null,
          mintedAt: new Date().toISOString(),
        });

        const completedTransaction = await petProfileRepository.saveTransaction(account, 'sbt', {
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
        const appError = toAppError(error, 'SBT_MINT_FAILED', 'SBT 발급에 실패했습니다.', { account });
        await petProfileRepository.saveTransaction(account, 'sbt', {
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
  createIssueSbtService,
};
