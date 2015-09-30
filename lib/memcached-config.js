
var oneDayInSeconds = 86400;

module.exports = {
  servers: {
    production:  ['thesceneprod1.pljwli.cfg.use1.cache.amazonaws.com:11211', 'thesceneprod2.pljwli.cfg.use1.cache.amazonaws.com:11211'],
    staging:     ['universalstaging1.pljwli.cfg.use1.cache.amazonaws.com:11211'],
    sandbox:     ['universalsandbox1.pljwli.cfg.use1.cache.amazonaws.com:11211'],
    development: ['localhost:11211'],
  },

  config: {
    retries: 0,
    failures: 1,
    timeout: 2000,
    retry: 0
  },

  ttl: oneDayInSeconds
}
