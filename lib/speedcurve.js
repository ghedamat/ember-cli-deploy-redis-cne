var SpeedCurve = require('speedcurve-api');

var RSVP = require('rsvp');

module.exports = function(environment) {
  var apiKeyString = 'SPEEDCURVE_' + environment.toUpperCase() + '_API_KEY';
  var apiKey = process.env[apiKeyString];
  var spd = new SpeedCurve(apiKey);

  return {
    deploy: function(revision) {
      var today = new Date().toString();
      var detail = [
        'The revision: ',
        revision,
        " activated on ",
        today,
        " by developer: ",
        process.env['CNE_DEV_USERNAME'],
        '.'].join('');
      return new RSVP.Promise(function(resolve, reject) {
        spd.deploy({
          note: revision,
          detail: detail
        }, function(err, data) {
          if (err != null) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      });
    }
  }
}
