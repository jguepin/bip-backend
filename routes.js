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
  app.get('/users/me', requireLogin, users.getSelf);

  // User places data
  app.get('/users/places', requireLogin, users.getPlaces);

  // User contacts
  app.post('/users/add_contact', requireLogin, users.addContact);
  app.get('/users/contacts', requireLogin, users.getContacts);

  // User notifs
  app.get('/users/notifications', requireLogin, users.getNotifications);

  /**
   * PLACES
   */
  app.get('/places/search', places.search);
  app.post('/places/save', requireLogin, places.save);
  app.delete('/places/:placeId', requireLogin, places.remove);
  app.post('/places/send', requireLogin, places.send);
};
