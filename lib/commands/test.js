var Task = require('ember-cli/lib/models/task');
var Promise = require('ember-cli/lib/ext/promise');

var MyTask = Task.extend({
  run: function() {
    var _self = this;
    return new Promise(function(resolve, reject) {
      var message = 'how did it turn out?';
      _self.ui.writeLine('What is up!');
      resolve(message);
    }).then(function(message) {
      _self.ui.writeLine(message);
      return message;
    });
  }
})

module.exports = {
  name: 'deploy:test',
  description: 'Does nothing, has a cool name!',
  works: 'insideProject',

  // availableOptions: [
  //   { name: 'environment', type: String, default: 'development', aliases: ['e',{'dev' : 'development'}, {'prod' : 'production'}] },
  //   { name: 'revision', type: String },
  //   { name: 'deploy-config-file', type: String, default: 'config/deploy.js' }
  // ],

  run: function(commandOptions, rawArgs) {
    var myNewTask = new MyTask({
      ui: this.ui
    });
    return myNewTask.run();
  }
};
