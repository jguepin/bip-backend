var bcrypt = require('bcrypt'),
    uuid = require('node-uuid');

var User = require('../models/user'),
    Place = require('../models/place'),
    Notification = require('../models/notification'),
    response = require('../helpers').response;

var SALT_WORK_FACTOR = 10;

// Signup a user with a username, email, password
exports.signup = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;

  if (!username || !password || !email) return response(req, res, 400, 'Missing field.');

  var user = new User();
  user.username = username;
  user.email = email;
  user.token = uuid();
  bcrypt.hash(password, SALT_WORK_FACTOR, function(err, passwordHash) {
    if (err) return response(req, res, 500, err);

    user.password = passwordHash;
    user.save(function(err) {
      if (err) {
        if (err.code === 11000)
          return response(req, res, 500, 'Duplicate username.');
        else if (err.name === 'ValidationError')
          return response(req, res, 400, 'Email is invalid.');

        return response(req, res, 500, err);
      }

      req.session.user = user;
      response(req, res, 200, user);
    });
  });
};

// Login a user with a username or an email and a password
exports.login = function(req, res) {
    var identifier = req.body.identifier;
    var password = req.body.password;
    if (!identifier || !password) return response(req, res, 400, 'Missing field.');
    User
      .findOne({ $or:[{ username: identifier }, { email: identifier }] })
      .exec(function(err, user) {
        if (err || !user) return response(req, res, 404, 'User not found');

        user.verifyPassword(req.body.password, function(err, match) {
          if (err || !match) return response(req, res, 401, 'Wrong password');

          req.session.user = user;
          response(req, res, 200, user);
        });
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
  var identifier = req.body.identifier;
  User
    .findOne({ $or: [{ username: identifier }, { email: identifier }] })
    .exec(function(err, user) {
      if (err || !user) return response(req, res, 404, 'User not found');

      // Save the contact user in the current user contacts
      var added = req.session.user.contacts.addToSet(user._id);
      if (added.length) {
        req.session.user.save(function(err) {
          if (err) return response(req, res, 500);

          return response(req, res, 200);
        });
      } else {
        return response(req, res, 200);
      }
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
  Notification
    .update({ _id: req.params.id }, { is_read: true })
    .exec(function(err) {
      if (err) return response(req, res, 500, err);

      return response(req, res, 200);
    });
};
