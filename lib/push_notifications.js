// Module to send push notifications to devices

var gcm = require('node-gcm'),
    async = require('async');

var config = require('../config');

var sendGCMPushNotification = function(token, notification, callback) {
  // Create a message
  var message = new gcm.Message({
    data: {
      key1: 'hello',
      key2: 'world'
    }
  });

  var sender = new gcm.Sender(config.googleApiKey);
  var registrationIds = [].concat(token);

  sender.send(message, registrationIds, 4, function(err, result) {
    console.log(err, result);
    callback(err);
  });
};

var sendAPNPushNotification = function(token, notification, callback) {
  // TODO
  callback();
};

exports.sendPushNotification = function(user, notification, callback) {
  async.each(user.devices, function(device, asyncCb) {
    if (device.android) {
      sendGCMPushNotification(device.android, notification, asyncCb);
    } else {
      sendAPNPushNotification(device.ios, notification, asyncCb);
    }
  }, callback);
};
