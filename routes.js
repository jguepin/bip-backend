var express = require('express');

var users = require('./controllers/users'),
    places = require('./controllers/places'),
    requireLogin = require('./helpers').requireLogin;

exports.map = function(app) {
  app.get('/', requireLogin, function(req, res) {
    res.send('Hello World!');
  });

  /**
   * USERS
   */
  // Login & signup
  app.post('/users/signup', users.signup);
  app.post('/users/login', users.login);

  // User places data
  app.get('/users/home', requireLogin, users.home);

  // User contacts
  app.post('/users/add_contact', requireLogin, users.addContact);

  /**
   * PLACES
   */
  app.get('/places/search', places.search);
  app.post('/places/save', requireLogin, places.save);
  app.delete('/places/:placeId', requireLogin, places.remove);
};
