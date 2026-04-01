function assertContractGateway(gateway) {
  const required = ['mintSbt', 'mintNft'];

  for (const method of required) {
    if (typeof gateway?.[method] !== 'function') {
      throw new Error(`contractGateway는 ${method} 메서드를 제공해야 합니다.`);
    }
  }
}

module.exports = {
  assertContractGateway,
};
