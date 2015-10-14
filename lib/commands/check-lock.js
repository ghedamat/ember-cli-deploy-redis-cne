var ConfigurationReader = require('../utilities/configuration-reader');

module.exports = {
  name: 'deploy:check-lock',
  description: 'Locks activations for `--environment`!',
  works: 'insideProject',

  availableOptions: [
    { name: 'environment', type: String, default: 'development', aliases: ['e',{'dev' : 'development'}, {'prod' : 'production'}] },
  ],

  run: function(commandOptions, rawArgs) {
    var CheckLockTask = require('../tasks/check-lock');
    var ui = this.ui;
    var config = new ConfigurationReader({
      environment: commandOptions.environment,
      project: this.project,
      ui: ui
    }).config;

    var checkLockTask = new CheckLockTask({
      config: config.get('store'),
      manifest: config.get('manifestPrefix'),
      ui: ui
    });

    return checkLockTask.run(commandOptions);
  }
};
