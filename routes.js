var express = require('express');

var users = require('./controllers/users'),
    places = require('./controllers/places'),
    requireLogin = require('./helpers').requireLogin;

exports.map = function(app) {
  app.get('/', requireLogin, function(req, res) {
    res.send('Hello World!');
  });

  app.post('/users/signup', users.signup);
  app.post('/users/login', users.login);
  app.get('/users/home', requireLogin, users.home);

  app.get('/places/search', places.search);
  app.post('/places/save', requireLogin, places.save);
  app.delete('/places/:placeId', requireLogin, places.remove);
};
