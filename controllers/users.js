var mongoose = require('mongoose'),
    bcrypt = require('bcrypt'),
    User = require('../models/user');

var SALT_WORK_FACTOR = 10;

// Signup a user with a username, email, password
exports.signup = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  var email = req.body.email;

  if (!username || !password || !email) return res.status(500).send({ message: 'Missing field.' });

  var user = new User();
  user.username = username;
  user.email = email;
  bcrypt.hash(password, SALT_WORK_FACTOR, function(err, passwordHash) {
    if (err) return res.status(500).send(err);

    user.password = passwordHash;
    user.save(function(err) {
      if (err) {
        if (err.code === 11000)
          return res.status(500).send({ message: 'Duplicate username.' });
        else if (err.name === 'ValidationError')
          return res.status(500).send({message: 'Email is invalid.' });

        return res.status(500).send(err);
      }

      req.session.user = user;
      res.send(user);
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
        if (err) return res.status(500).send(err);
        if (!match) return res.status(401).send(false);

        req.session.user = user;
        res.send(true);
      });
    });
};
