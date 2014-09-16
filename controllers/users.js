var bcrypt = require('bcrypt'),
    uuid = require('node-uuid');

var User = require('../models/user'),
    Place = require('../models/place'),
    response = require('../helpers').response;

var SALT_WORK_FACTOR = 10;

// Signup a user with a username, email, password
exports.signup = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;

  if (!username || !password || !email) return response(res, 400, 'Missing field.');

  var user = new User();
  user.username = username;
  user.email = email;
  user.token = uuid();
  bcrypt.hash(password, SALT_WORK_FACTOR, function(err, passwordHash) {
    if (err) return response(res, 500, err);

    user.password = passwordHash;
    user.save(function(err) {
      if (err) {
        if (err.code === 11000)
          return response(res, 500, 'Duplicate username.');
        else if (err.name === 'ValidationError')
          return response(res, 400, 'Email is invalid.');

        return response(res, 500, err);
      }

      req.session.user = user;
      response(res, 200, user);
    });
  });
};

// Login a user with a username or an email and a password
exports.login = function(req, res) {
    var identifier = req.body.identifier;
    var password = req.body.password;
    if (!identifier || !password) return response(res, 400, 'Missing field.');
    User
        .findOne({ $or:[{ username: identifier }, { email: identifier }] })
        .exec(function(err, user) {
            if (err || !user) return response(res, 404, 'User not found');

            user.verifyPassword(req.body.password, function(err, match) {
                if (err || !match) return response(res, 401, 'Wrong password');

                req.session.user = user;
                response(res, 200, user);
            });
        });
};

// Get the home of a user (all places he saved)
exports.home = function(req, res) {
  Place
    .find({ _id: { $in: req.session.user.places }})
    .exec(function(err, places) {
      if (err) return response(res, 500, err);
      return response(res, 200, places);
  });
};
