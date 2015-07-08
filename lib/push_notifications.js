// Module to send push notifications to devices

var gcm = require('node-gcm');
var apn = require('apn');
var async = require('async');

var config = require('../config');

var sendGCMPushNotification = function(token, notification, callback) {
  // Create a message
  var message = new gcm.Message({ data: notification });

  var sender = new gcm.Sender(config.googleApiKey);
  var registrationIds = [].concat(token);

  return sender.send(message, registrationIds, 4, function(err) {
    return callback(err);
  });
};

var sendAPNPushNotification = function(token, notification, callback) {
  var message = new apn.Notification();
  message.payload = notification;

  var apnConnection = new apn.Connection();
  var device = new apn.Device(token);

  apnConnection.pushNotification(message, device);
  return callback();
};

exports.sendPushNotification = function(user, notification, callback) {
  return async.each(user.devices, function(device, asyncCb) {
    if (device.android) {
      return sendGCMPushNotification(device.android, notification, asyncCb);
    } else {
      return sendAPNPushNotification(device.ios, notification, asyncCb);
    }
  }, callback);
};
