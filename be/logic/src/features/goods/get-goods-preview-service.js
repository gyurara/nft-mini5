function createGetGoodsPreviewService({ sessionGateway }) {
  return {
    async execute(account) {
      const tokenState = await sessionGateway.getTokenState(account);
      const canPreview = Boolean(tokenState.hasNft);

      return {
        enabled: canPreview,
        reason: canPreview ? null : 'NFT 보유자만 굿즈 미리보기를 사용할 수 있습니다.',
        previewImageUrl: canPreview ? 'https://placekitten.com/600/600' : null,
        ctaLabel: '제작하기',
        canOrder: false,
      };
    },
  };
}

module.exports = {
  createGetGoodsPreviewService,
};
