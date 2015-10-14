var CoreObject  = require('core-object');
var RSVP        = require('rsvp');
var redis       = require('then-redis');
var chalk       = require('chalk');
var Promise     = require('ember-cli/lib/ext/promise');
var SilentError = require('ember-cli/lib/errors/silent');
var syncExec    = require('sync-exec');

var green = chalk.green;
var white = chalk.white;
var red = chalk.red;

// TODO: dry this up since we use this in hipchat!
var getUser = "finger $(whoami) | awk -F: '{ print $3 }' | head -n1 | sed 's/^ //' | awk '{print $2, $1}'";

module.exports = CoreObject.extend({
  init: function() {
    this.client       = redis.createClient(this.config);
    this.env          = this.config.storeEnv;
    this.hipchat      = require('../lib/hipchat')(this.env)
  },

  lock: function() {
    var _self = this;
    return this._locked()
      .then(function(value) {
        var message;
        if (value) {
          message = _self._alreadyLockedMessage(value);
          return message;
        } else {
          var lockMessage = _self._lockMessage();
          return _self._lock(lockMessage).then(function(status) {
            message = JSON.stringify(status) + " all good we're locked!\n\n" + red(lockMessage);
            return message;
          })
        }
      })
      .then(_self._printSuccessMessage.bind(_self));
  },

  unlock: function() {
    var _self = this;
    return this._locked()
      .then(function(value) {
        var message;
        if (value) {
          return _self._unlock().then(function(status) {
            // TODO: show locked and prompt user!
            message = JSON.stringify(status) + " all good we're unlocked!";
            return green(message);
          })
        } else {
          message = "Not Locked! All good!";
          return green(message);
        }
      })
      .then(_self._printSuccessMessage.bind(_self));
  },

  checkLock: function() {
    var _self = this;
    return this._locked()
      .then(function(value) {
        var message;
        if (value) {
          return _self._printErrorMessage(value);
        } else {
          message = "No locks exist! Safe to deploy!";
          _self._printSuccessMessage(green(message));
          return message;
        }
      })
  },

  _lockedKey: function() {
    return 'locked:' + this.manifest + ':locked';
  },

  _locked: function() {
    var _self = this;
    return new Promise(function(resolve, reject) {
      _self.client.get(_self._lockedKey())
        .then(function(value) {
          if (!value || value === 'false') {
            resolve(false);
          } else {
            resolve(value);
          }
        })
    })
  },

  _lock: function(message) {
    return this.client.set(this._lockedKey(), this._lockMessage());
  },

  _unlock: function() {
    return this.client.set(this._lockedKey(), 'false');
  },

  _printSuccessMessage: function(message) {
    return this.ui.writeLine(message);
  },

  _printErrorMessage: function(message) {
    return Promise.reject(new SilentError(message));
  },

  _alreadyLockedMessage: function(message) {
    return green("Already Locked!\n\n") + red(message);
  },

  _lockMessage: function() {
    var user = syncExec(getUser).stdout.trim();
    return "Activation locked by " + user + ".\n";
  }
});
