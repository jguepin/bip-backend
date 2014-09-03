var express = require('express');

var users = require('./controllers/users'),
    places = require('./controllers/places');

exports.map = function(app) {
  app.get('/', function(req, res) {
    res.send('Hello World!');
  });

  app.post('/users/signup', users.signup);
  app.post('/users/login', users.login);

  app.get('/places/search', places.search);
};
