
var oneDayInSeconds = 86400;

module.exports = {
  servers: [
    'thesceneprod1.pljwli.cfg.use1.cache.amazonaws.com:11211',
    'thesceneprod2.pljwli.cfg.use1.cache.amazonaws.com:11211'
  ],

  // README: Storing these here. Currently only for testing purposes.
  //         Change the
  stagingServers: [
    'universalstaging1.pljwli.cfg.use1.cache.amazonaws.com:11211'
  ],

  developmentServers: [
    'localhost:11211'
  ],

  config: {
    retries: 0,
    failures: 1,
    timeout: 2000,
    retry: 0
  },

  ttl: oneDayInSeconds
}
