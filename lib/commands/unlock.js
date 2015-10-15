var ConfigurationReader = require('../utilities/configuration-reader');

module.exports = {
  name: 'deploy:unlock',
  description: 'Unlocks `--environment` for activations!',
  works: 'insideProject',

  availableOptions: [
    { name: 'environment', type: String, default: 'development', aliases: ['e',{'dev' : 'development'}, {'prod' : 'production'}] },
  ],

  run: function(commandOptions, rawArgs) {
    var UnlockTask = require('../tasks/unlock');
    var ui = this.ui;
    var config = new ConfigurationReader({
      environment: commandOptions.environment,
      project: this.project,
      ui: ui
    }).config;

    var unlockTask = new UnlockTask({
      config: config.get('store'),
      manifest: config.get('manifestPrefix'),
      ui: ui
    });

    return unlockTask.run(commandOptions);
  }
};
