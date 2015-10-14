/* jshint node: true */
'use strict';

var commands = require('./lib/commands');

var RedisCneAdapter = require('./lib/redis');

module.exports = {
  name: 'ember-cli-deploy-redis-cne',
  type: 'ember-deploy-addon',

  adapters: {
    index: {
      'redis-cne': RedisCneAdapter
    }
  },
  includedCommands: function() {
    return commands;
  }
};
