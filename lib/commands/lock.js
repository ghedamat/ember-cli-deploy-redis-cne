var ConfigurationReader = require('../utilities/configuration-reader');

module.exports = {
  name: 'deploy:lock',
  description: 'Locks activations for `--environment`!',
  works: 'insideProject',

  availableOptions: [
    { name: 'environment', type: String, default: 'development', aliases: ['e',{'dev' : 'development'}, {'prod' : 'production'}] },
  ],

  run: function(commandOptions, rawArgs) {
    var LockTask = require('../tasks/lock');
    var ui = this.ui;
    var config = new ConfigurationReader({
      environment: commandOptions.environment,
      project: this.project,
      ui: ui
    }).config;

    var lockTask = new LockTask({
      config: config.get('store'),
      manifest: config.get('manifestPrefix'),
      ui: ui
    });

    return lockTask.run(commandOptions);
  }
};
