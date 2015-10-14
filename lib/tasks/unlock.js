var Task = require('ember-cli/lib/models/task');
var Promise = require('ember-cli/lib/ext/promise');
var LockerGuy = require('../locker-guy');

module.exports = Task.extend({
  run: function(options) {
    var locker = new LockerGuy({
      config: this.config,
      manifest: this.manifest,
      ui: this.ui
    });
    return locker.unlock();
  }
});
