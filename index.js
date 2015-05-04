/* jshint node: true */
'use strict';

var RedisCneAdapter = require('./lib/redis');

module.exports = {
  name: 'ember-cli-deploy-redis-cne',
  type: 'ember-deploy-addon',

  adapters: {
    index: {
      'redis-cne': RedisCneAdapter
    }
  }
};
