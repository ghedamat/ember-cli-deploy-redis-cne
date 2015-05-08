var Memcached = require('memcached');
var memcachedConfig = require('../lib/memcached-config');

var RSVP = require('rsvp');

var servers = memcachedConfig.servers;
var config = memcachedConfig.config;
var ttl = memcachedConfig.ttl;

module.exports = {
  read: function(key) {
    return this._readMultiple(key);
  },

  write: function(key, value) {
    return this._writeMultiple(key, value);
  },

  _readMultiple: function(key) {
    var promises = [];
    for (var i = 0, len = servers.length; i < len; i++) {
      var instance = new Memcached(servers[i], config);
      promises.push(this._read(instance, key));
    }
    return RSVP.all(promises);
  },

  _read: function(instance, key) {
    return new RSVP.Promise(function(resolve, reject) {
      instance.get(key, function(error, result) {
        if (error) {
          reject({
            error: 'memcached read failure',
            servers: instance.servers
          });
        } else {
          resolve(result.toString());
        }
      });
    })
  },

  _writeMultiple: function(key, value) {
    var promises = [];
    for (var i = 0, len = servers.length; i < len; i++) {
      var instance = new Memcached(servers[i], config);
      promises.push(this._write(instance, key, value));
    }
    return RSVP.all(promises);
  },

  _write: function(instance, key, value) {
    return new RSVP.Promise(function(resolve, reject) {
      instance.set(key, value, ttl, function(error) {
        if (error) {
          reject({
            error: 'memcached write failure',
            servers: instance.servers
          });
        } else {
          resolve();
        }
      });
    })
  }
}
