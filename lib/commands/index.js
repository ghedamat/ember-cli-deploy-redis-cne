module.exports = {
  "deploy:test": require('./test'),
  "deploy:lock": require('./lock'),
  "deploy:unlock": require('./unlock'),
  "deploy:check-lock": require('./check-lock'),
};
