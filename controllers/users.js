var bcrypt = require('bcrypt');
var uuid = require('node-uuid');
var _ = require('lodash');
var async = require('async');
var rarity = require('rarity');

var User = require('../models/user');
var Place = require('../models/place');
var Notification = require('../models/notification');
var response = require('../helpers').response;

var SALT_WORK_FACTOR = 10;

// Signup a user with a username, email, password
exports.signup = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;

  if (!username || !password || !email) return response(req, res, 400);

  var user = new User();
  user.username = username.toLowerCase();
  user.email = email;
  user.token = uuid();

  async.waterfall([
    function(callback) {
      bcrypt.hash(password, SALT_WORK_FACTOR, callback);
    },
    function(passwordHash, callback) {
      user.password = passwordHash;
      user.save(callback);
    }

  ], function(err) {
    if (err && err.code === 11000) return response(req, res, 500, 'Duplicate username.');
    if (err && err.name === 'ValidationError') return response(req, res, 400, 'Email is invalid.');
    if (err) return response(req, res, 500, err);

    req.session.user = user;
    response(req, res, 200, user);
  });
};

// Login a user with a username or an email and a password
exports.login = function(req, res) {
  var identifier = req.body.identifier.toLowerCase();
  var password = req.body.password;
  if (!identifier || !password) return response(req, res, 400);

  async.waterfall([
    function(callback) {
      User
        .findOne({ $or:[{ username: identifier }, { email: identifier }] })
        .exec(rarity.slice(2, callback));
    },
    function(user, callback) {
      if (!user) return callback('notfound');

      user.verifyPassword(req.body.password, rarity.carry([user], callback));
    }
  ], function(err, user, match) {
    if (err === 'notfound') return response(req, res, 404, 'User not found');
    if (err) return response(req, res, 500);
    if (!match) return response(req, res, 401, 'Wrong password');

    req.session.user = user;
    response(req, res, 200, user);
  });
};

// Add a push token to a user for notifications
exports.addPushToken = function(req, res) {
  var token;
  if (req.body.android) {
    token = { android: req.body.android };
  } else if (req.body.ios) {
    token = { ios: req.body.ios };
  } else {
    return response(req, res, 400, 'Token is missing.');
  }

  if (!_.some(req.session.user.devices, token)) {
    req.session.user.devices.push(token);
    req.session.user.markModified('devices');
    req.session.user.save(function(err) {
      if (err) return response(req, res, 500, err);
      return response(req, res, 200);
    });
  } else {
    return response(req, res, 200);
  }
};

// Remove a push token from a user (after a logout)
exports.removePushToken = function(req, res) {
  var token;
  if (req.body.android) {
    token = { android: req.body.android };
  } else if (req.body.ios) {
    token = { ios: req.body.ios };
  } else {
    return response(req, res, 400, 'Token is missing.');
  }

  req.session.user.devices = _.reject(req.session.user.devices, token);
  req.session.user.markModified('devices');
  req.session.user.save(function(err) {
    if (err) return response(req, res, 500);
    return response(req, res, 200);
  });
};

// Get the profile of the connected user
exports.getSelf = function(req, res) {
  response(req, res, 200, req.session.user);
};

// Get all the places of a user
exports.getPlaces = function(req, res) {
  Place
    .find({ _id: { $in: req.session.user.places }})
    .exec(function(err, places) {
      if (err) return response(req, res, 500, err);
      return response(req, res, 200, places);
  });
};

// Add a contact to a user
exports.addContact = function(req, res) {
  var identifier = req.body.identifier.toLowerCase();
  if (!identifier) return response(req, res, 400, 'Contact identifier is missing.');

  async.waterfall([
    function(callback) {
      User
        .findOne({ $or: [{ username: identifier }, { email: identifier }] })
        .exec(rarity.slice(2, callback));
    },
    function(user, callback) {
      if (!user) return callback('notfound');

      // Save the contact user in the current user contacts
      var added = req.session.user.contacts.addToSet(user._id);
      if (added.length) {
        req.session.user.save(rarity.carry([user], callback));
      } else {
        return callback(null, user);
      }
    },
  ], function(err, user) {
    if (err === 'notfound') return response(req, res, 404, 'User not found');
    if (err) return response(req, res, 500);

    return response(req, res, 200, user);
  });
};

exports.getContacts = function(req, res) {
  User
    .find({ _id: { $in: req.session.user.contacts }})
    .exec(function(err, users) {
      if (err) return response(req, res, 500, err);
      return response(req, res, 200, users);
    });
};

exports.getNotifications = function(req, res) {
  Notification
    .find({ to_user: req.session.user._id })
    .populate('place from_user')
    .exec(function(err, notifs) {
      if (err) return response(req, res, 500, err);
      return response(req, res, 200, notifs);
    });
};

exports.markNotificationAsRead = function(req, res) {
  var notifId = req.params.id;
  if (!notifId) return response(req, res, 400);

  async.waterfall([
    function(callback) {
      Notification
        .findOne({ _id: req.params.id })
        .exec(rarity.slice(2, callback));
    },
    function(notification, callback) {
      // Mark notification as read
      notification.is_read = true;
      notification.save(rarity.slice(2, callback));
    },
    function(notification, callback) {
      // Save the place in user places
      req.session.user.savePlace(notification.place, callback);
    }
  ], function(err) {
    if (err) return response(req, res, 500, err);
    return response(req, res, 200);
  });
};
