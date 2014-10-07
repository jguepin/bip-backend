var express = require('express');

var users = require('./controllers/users'),
    places = require('./controllers/places'),
    requireLogin = require('./helpers').requireLogin;

exports.map = function(app) {
  app.get('/', function(req, res) {
    res.send('Welcome to Town!');
  });

  /**
   * USERS
   */
  // Login & signup
  app.post('/users/signup', users.signup);
  app.post('/users/login', users.login);
  app.get('/users/me', requireLogin, users.getSelf);

  // Push tokens
  app.post('/users/push_token', requireLogin, users.addPushToken);

  // User places data
  app.get('/users/places', requireLogin, users.getPlaces);

  // User contacts
  app.post('/users/add_contact', requireLogin, users.addContact);
  app.get('/users/contacts', requireLogin, users.getContacts);

  // User notifs
  app.get('/users/notifications', requireLogin, users.getNotifications);
  app.post('/users/notifications/:id/read', requireLogin, users.markNotificationAsRead);

  /**
   * PLACES
   */
  app.get('/places/search', places.textSearch);
  app.get('/places/nearby', places.nearbySearch);

  app.post('/places/save', requireLogin, places.save);
  app.delete('/places/:placeId', requireLogin, places.remove);
  app.post('/places/send', requireLogin, places.send);
};
