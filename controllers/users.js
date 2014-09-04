var bcrypt = require('bcrypt'),
    uuid = require('node-uuid');

var User = require('../models/user'),
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

      response(res, 200, user);
    });
  });
};

// Login a user with a username or an email and a password
exports.login = function(req, res) {
  var loginFields = req.body.username ? { username: req.body.username } : { email: req.body.email };
  User
    .findOne(loginFields)
    .exec(function(err, user) {
      user.verifyPassword(req.body.password, function(err, match) {
        if (err) return response(res, 500, err);
        if (!match) return response(res, 401, 'Wrong password');

        response(res, 200, user);
      });
    });
};
