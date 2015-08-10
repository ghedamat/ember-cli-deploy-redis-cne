var CoreObject  = require('core-object');
var RSVP        = require('rsvp');
var redis       = require('then-redis');
var chalk       = require('chalk');
var Promise     = require('ember-cli/lib/ext/promise');
var SilentError = require('ember-cli/lib/errors/silent');
var IndexToConfig = require('../lib/index-to-config');

var DEFAULT_MANIFEST_SIZE   = 10;
var DEFAULT_TAGGING_ADAPTER = 'sha';

var green = chalk.green;
var white = chalk.white;

module.exports = CoreObject.extend({
  init: function() {
    this.manifestSize = this.manifestSize || DEFAULT_MANIFEST_SIZE;
    this.client       = redis.createClient(this.config);
    this.env          = this.config.storeEnv;
    this.memcached    = require('../lib/memcached')(this.env);
    this.speedcurve    = require('../lib/speedcurve')(this.env);
  },

  upload: function(indexFile) {
    var key            = this.taggingAdapter.createTag();
    var configJSON = IndexToConfig.convert(indexFile);
    return this._upload(configJSON, key);
  },

  list: function() {
    return RSVP.hash({
      revisions: this._list(),
      current: this._current()
    })
    .then(function(results) {
      var revisions = results.revisions;
      var current   = results.current;
      var message   = this._revisionListMessage(revisions, current);

      this._printSuccessMessage(message);

      return message;
    }.bind(this));
  },

  activate: function(revisionKey) {
    if (!revisionKey) {
      return this._printErrorMessage(this._noRevisionPassedMessage());
    };

    var uploadKey = this._currentKey();
    var _self = this;

    return new RSVP.Promise(function(resolve, reject) {
      _self._list()
        .then(function(uploads) {
          return uploads.indexOf(revisionKey) > -1 ? resolve() : reject({error: 'not found in redis'});
        })
        .then(function() {
          _self.ui.writeLine(green('\nWriting key to redis...'));
          return _self.client.set(uploadKey, revisionKey);
        })
        .then(resolve);
    })
    .then(function() {
      if (_self.env !== 'development') {
        _self.ui.writeLine(green('\nWriting key to memcached...'));
        return _self.memcached.write(uploadKey, revisionKey);
      } else {
        return true;
      }
    })
    .then(this._memcachedSuccessMessage)
    .then(this._printSuccessMessage.bind(this))
    // Trigger SpeedCurve Deploy Test (only on staging)
    // TODO: Modify when their api improves
    .then(function() {
      if (_self.env === 'staging') {
        _self.ui.writeLine(green('\nTriggering SpeedCurve Deploy Test...'));
        return _self.speedcurve.deploy(revisionKey)
          .then(function(data) {
            _self.ui.writeLine(green('\nSpeedCurve Deploy Test triggered! Deployment ID: ' + data.id));
            return data;
          });
      } else {
        return true;
      }
    })
    .then(this._activationSuccessfulMessage)
    .then(this._printSuccessMessage.bind(this))
    .catch(function(reason) {
      var error = reason && reason.error;
      if (error === 'not found in redis') {
        return this._printErrorMessage(this._revisionNotFoundMessage());
      } else if (error === 'memcached write failure') {
        var servers = reason && reason.servers;
        return this._printErrorMessage(this._memcachedErrorMessage(servers));
      } else {
        this._printErrorMessage(reason);
      }
    }.bind(this));
  },

  _list: function() {
    return this.client.lrange(this.manifest, 0, this.manifestSize - 1)
  },

  _current: function() {
    return this.client.get(this._currentKey());
  },

  _initTaggingAdapter: function() {
    var TaggingAdapter = require('../tagging/'+this.tagging);

    return new TaggingAdapter({
      manifest: this.manifest
    });
  },

  _upload: function(value, key) {
    return this._uploadIfNotAlreadyInManifest(value, key)
      .then(this._updateManifest.bind(this, this.manifest, key))
      .then(this._cleanUpManifest.bind(this))
      .then(this._deploySuccessMessage.bind(this, key))
      .then(this._printSuccessMessage.bind(this))
      .then(function() { return key; })
      .catch(function(reason) {
        var error = reason && reason.error;
        var message;
        if (error === 'already in manifest') {
          // Don't exit in a yucky state if reference is already there...
          // In case jenkins re-deploys the same sha, we still want the
          // build to succeed.
          message = this._doubleDeployMessage(key);
          return this._printSuccessMessage(message)
        } else {
          // TODO: ^ See above ^
          //    This is actually the wrong error at this point.
          //    We've decided to 'whitelist' the double deploy error.
          //    Fix? -SN
          message = this._deployErrorMessage();
          return this._printErrorMessage(message);
        }
      }.bind(this));
  },

  _uploadIfNotAlreadyInManifest: function(value, key) {
    var that = this;

    return new RSVP.Promise(function(resolve, reject) {
      that.client.get(key)
        .then(function(result) {
          if (result === null) {
            resolve()
          } else {
            reject({
              error: 'already in manifest'
            })
          }
        })
        .then(function() {
          return that.client.set(key, value);
        })
        .then(resolve);
    });
  },

  _updateManifest: function(manifest, key) {
    return this.client.lpush(manifest, key);
  },

  _cleanUpManifest: function() {
    return this.client.ltrim(this.manifest, 0, this.manifestSize - 1);
  },

  _currentKey: function() {
    return this.manifest+':current';
  },

  _printSuccessMessage: function(message) {
    return this.ui.writeLine(message);
  },

  _printErrorMessage: function(message) {
    return Promise.reject(new SilentError(message));
  },

  _deploySuccessMessage: function(revisionKey) {
    var success       = green('\nUpload successful!\n\n');
    var uploadMessage = white('Uploaded revision: ')+green(revisionKey);

    return success + uploadMessage;
  },

  _doubleDeployMessage: function(revisionKey) {
    var success = green('\nUpload ALREADY a success!\n\n');
    var disclaimer = white('(most likely)\n\n') +
      'The revision ' + green(revisionKey) + ' has already been uploaded.\n' +
      'Please run `'+ green('ember deploy:list') + '` to confirm.\n\n';
    var action = 'If you feel this is an error, feel free to delete the key ' + green(revisionKey) +
      ' from redis\nand run `' + green('ember deploy -e <environment>') + '` again.';
    return success + disclaimer + action;
  },

  _deployErrorMessage: function() {
    var failure    = '\nUpload failed!\n';
    var suggestion = 'Did you try to upload an already uploaded revision?\n\n';
    var solution   = 'Please run `'+green('ember deploy:list')+'` to ' +
                     'investigate.';

    return failure + '\n' + white(suggestion) + white(solution);
  },

  _noRevisionPassedMessage: function() {
    var err = '\nError! Please pass a revision to `deploy:activate`.\n\n';

    return err + white(this._revisionSuggestion());
  },

  _activationSuccessfulMessage: function() {
    var success = green('\nActivation successful!\n\n');
    var message = white('Please run `'+green('ember deploy:list')+'` to see '+
                        'what revision is current.');

    return success + message;
  },

  _revisionNotFoundMessage: function() {
    var err = '\nError! Passed revision could not be found in manifest!\n\n';

    return err + white(this._revisionSuggestion());
  },

  _revisionSuggestion: function() {
    var suggestion = 'Try to run `'+green('ember deploy:list')+'` '+
                     'and pass a revision listed there to `' +
                     green('ember deploy:activate')+'`.\n\nExample: \n\n'+
                     'ember deploy:activate --revision <manifest>:<sha>';

    return suggestion;
  },

  _revisionListMessage: function(revisions, currentRevision) {
    var manifestSize  = this.manifestSize;
    var headline      = '\nLast '+ manifestSize + ' uploaded revisions:\n\n';
    var footer        = '\n\n# => - current revision';
    var revisionsList = revisions.reduce(function(prev, curr) {
      var prefix = (curr === currentRevision) ? '| => ' : '|    ';
      return prev + prefix + chalk.green(curr) + '\n';
    }, '');

    return headline + revisionsList + footer;
  },

  _memcachedSuccessMessage: function() {
    return white('\n(Memcache Write successful)');
  },

  _memcachedErrorMessage: function(servers) {
    // var server = servers && servers[0]
    var message = "ERROR:\n\nFailed to write to memcached.\n\n" +
    "As it turns out, we had trouble with " + white(servers) + "\n" +
    "Please check your connection to memcached \nand re-run " +
    green('`ember deploy:activate`') +
    " with the desired revision."
    return message;
  }
});
