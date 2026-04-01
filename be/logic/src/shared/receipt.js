const { AppError } = require('./errors');

function extractTokenId(mintResult, expectedEventName) {
  if (!mintResult || typeof mintResult !== 'object') {
    throw new AppError('INVALID_RECEIPT', 'mint 결과가 비어 있습니다.');
  }

  if (mintResult.tokenId !== undefined && mintResult.tokenId !== null) {
    return Number(mintResult.tokenId);
  }

  const events = Array.isArray(mintResult.events) ? mintResult.events : Array.isArray(mintResult.receipt?.events) ? mintResult.receipt.events : [];
  const event = events.find((candidate) => candidate?.eventName === expectedEventName || candidate?.name === expectedEventName);
  const rawTokenId = event?.tokenId ?? event?.args?.tokenId ?? event?.args?.[1];

  if (rawTokenId === undefined || rawTokenId === null) {
    throw new AppError('INVALID_RECEIPT', `${expectedEventName} 이벤트에서 tokenId를 찾을 수 없습니다.`);
  }

  return Number(rawTokenId);
}

module.exports = {
  extractTokenId,
};
