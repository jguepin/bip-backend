var express = require('express');

var users = require('./controllers/users');

exports.map = function(app) {
  app.get('/', function(req, res) {
    res.send('Hello World!');
  });

  app.post('/users/signup', users.signup);
  app.post('/users/login', users.login);
};
