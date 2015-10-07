var hipchat = require('node-hipchat');
var format = require("string-template");
var syncExec = require('sync-exec');
var RSVP = require('rsvp');

var HC = new hipchat(process.env['HIPCHAT_API_KEY']);

var commands = {
  getUser: "finger $(whoami) | awk -F: '{ print $3 }' | head -n1 | sed 's/^ //' | awk '{print $2, $1}'",
  getCommitMessage: "git log -1 --pretty=format:%h:%s {0}"
};

module.exports = function(environment) {
  return {
    env: environment,
    notify: function(revision) {
      var sha = revision.split(":")[1];
      var gitLog = syncExec(format(commands.getCommitMessage, sha)).stdout.trim();

      var msgParams = {
        user: syncExec(commands.getUser).stdout.trim(),
        env: this.env,
        revision: revision,
        sha: sha,
        subject: gitLog.split(':')[1]
      };

      var template = "<b>{user}</b> activated thescene-frontend to <b>{env}</b>" +
        " <a href='https://github.com/cnerepo/thescene-frontend/commit/{sha}'>{revision}</a>" +
        " - {subject}";

      var message = format(template, msgParams);

      var params = {
        room: '2000569',
        from: 'Deploy',
        color: 'green',
        message: message
      };

      return new RSVP.Promise(function(resolve, reject) {
        HC.postMessage(params, function(data) {
          resolve(data);
        })
      })
    }
  }
}
