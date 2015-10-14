var CoreObject  = require('core-object');
var RSVP        = require('rsvp');
var redis       = require('then-redis');
var chalk       = require('chalk');
var Promise     = require('ember-cli/lib/ext/promise');
var SilentError = require('ember-cli/lib/errors/silent');

var green = chalk.green;
var white = chalk.white;

module.exports = CoreObject.extend({
  init: function() {
    this.client       = redis.createClient(this.config);
    this.env          = this.config.storeEnv;
    this.hipchat      = require('../lib/hipchat')(this.env)
  },

  lock: function() {
    var _self = this;
    return new Promise(function(resolve, reject) {
        return _self._locked()
          .then(function(value) {
            resolve(value);
          })
      })
      .then(function(value) {
        var message;
        if (value && value !== 'false') {
          message = "Already Locked! Here's the message:\n\n" + value;
          return message;
        } else {
          return _self._lock().then(function(status) {
            message = JSON.stringify(status) + " all good we're locked!";
            return message;
          })
        }
      })
      .then(_self._printSuccessMessage.bind(_self));
  },

  _lockedKey: function() {
    return 'locked:' + this.manifest + ':locked';
  },

  _locked: function() {
    return this.client.get(this._lockedKey());
  },

  _lock: function() {
    return this.client.set(this._lockedKey(), "A sweet Message!");
  },

  // _unlock: function() {
  //   return this.
  // },

  _printSuccessMessage: function(message) {
    return this.ui.writeLine(message);
  },

  _printErrorMessage: function(message) {
    return Promise.reject(new SilentError(message));
  }
});
