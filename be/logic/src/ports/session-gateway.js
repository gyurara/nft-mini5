function assertSessionGateway(gateway) {
  const required = ['assertConnected', 'getTokenState', 'refreshTokenState'];

  for (const method of required) {
    if (typeof gateway?.[method] !== 'function') {
      throw new Error(`sessionGateway는 ${method} 메서드를 제공해야 합니다.`);
    }
  }
}

module.exports = {
  assertSessionGateway,
};
