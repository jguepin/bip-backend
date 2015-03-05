var async = require('async');
var rarity = require('rarity');
var _ = require('lodash');

var google = require('../lib/google');
var foursquare = require('../lib/foursquare');
var pushNotifications = require('../lib/push_notifications');
var response = require('../helpers').response;
var config = require('../config');
var Place = require('../models/place');
var Notification = require('../models/notification');
var User = require('../models/user');

var placesApi = config.placesApi === 'foursquare' ? foursquare : google;

var searchCallback = function(err, places, next, req, res) {
  if (err) return response(req, res, 500, err);

  async.map(places, function(place, callback) {
    // Get detailed information about the place from the Places API
    placesApi.getPlaceDetails(place, function(err, placeBody) {
      if (err) return callback(err);

      // Return a parsed version of the place
      callback(null, Place.mapItem(placeBody));
    });
  }, function(err, places) {
    if (err) return response(req, res, 500, err);

    response(req, res, 200, places, next);
  });
};

exports.textSearch = function(req, res) {
  placesApi.searchPlaces(req.query.query, req.query.location, function(err, places, next) {
    searchCallback(err, places, next, req, res);
  });
};

exports.nearbySearch = function(req, res) {
  placesApi.nearbyPlaces(req.query.location, function(err, places, next) {
    searchCallback(err, places, next, req, res);
  });
};

var getOrCreatePlace = function(placeData, callback) {
  if (!(placeData._id || placeData.place_id || placeData.venue_id))
    return callback('Missing parameter!');

  if (placeData._id) {
    // It's a place from our DB
    Place
      .findOne({ _id: placeData._id })
      .exec(function(err, place) {
        if (err || !place) return callback(err || 'Place not found.');
        return callback(null, place);
      });

  } else {
    // It's a place from Google Places or Foursquare
    var criteria = {};
    if (placeData.place_id) {
      criteria.place_id = placeData.place_id;
    } else {
      criteria.venue_id = placeData.venue_id;
    }

    Place
      .findOne(criteria)
      .exec(function(err, place) {
        if (err) return callback(err);

        if (place) {
          // Place already saved in our db
          return callback(null, place);
        } else {
        // The place is not saved in our db yet, save it!
          place = new Place();
          place.place_id = placeData.place_id;
          place.venue_id = placeData.venue_id;
          place.name = placeData.name;
          place.location = placeData.location;
          place.type = placeData.type;
          place.address = placeData.address;
          place.latitude = placeData.latitude;
          place.longitude = placeData.longitude;
          place.price = placeData.price;
          place.hours = placeData.hours;
          place.phone = placeData.phone;
          place.photos = placeData.photos;

          place.save(function(err) {
            callback(err, place);
          });
        }
    });
  }
};

exports.save = function(req, res) {
  async.waterfall([
    function(callback) {
      getOrCreatePlace(req.body, callback);
    },
    function(place, callback) {
      // Save the place in the user places
      req.session.user.savePlace(place._id, callback);
    }
  ], function(err) {
    if (err) return response(req, res, 500, err);
    return response(req, res, 200);
  });
};

exports.send = function(req, res) {
  var responded = false;
  var sentPlace;

  async.waterfall([
    // Map user ids to req.body.to_users if usernames are given
    function(callback) {
      var isUsernames = _.find(req.body.to_users, function(to_user) {
        return !/^[0-9a-fA-F]{24}$/.test(to_user);
      });
      if (!isUsernames) {
        return callback();
      }
      // Get user ids from usernames
      async.map(req.body.to_users, function(to_user, mapCb) {
        User.findOne({ username: to_user.toLowerCase() }, '_id', function(err, user) {
          return mapCb(err, user._id);
        });
      }, function(err, users) {
        req.body.to_users = users;
        return callback(err);
      });
    },
    function(callback) {
      console.log('payload!', req.body.place, req.body.place && req.body.place.photos && req.body.place.photos.length && req.body.place.photos[0].l);
      getOrCreatePlace(req.body.place, callback);
    },
    function(place, callback) {
      if (!place) return callback(true);
      sentPlace = place;

      // Add a notification to all destination users
      async.each(req.body.to_users, function(to_user_id, eachCb) {
        var notif = new Notification();
        notif.from_user = req.session.user._id;
        notif.place = place._id;
        notif.message = req.body.message;
        notif.to_user = to_user_id;
        notif.save(eachCb);
      }, rarity.slice(1, callback));
    },
    function(callback) {
      // Save the place in the sender places
      req.session.user.savePlace(sentPlace._id, rarity.slice(1, callback));
    },
    function(callback) {
      response(req, res, 200);
      responded = true;

      // The response has been sent to the user, we can send push notifications to destination users devices in background
      User
        .find({ _id: { $in: req.body.to_users }})
        .exec(rarity.slice(2, callback));
    },
    function(users, callback) {
      async.each(users, function(user, eachCb) {
        pushNotifications.sendPushNotification(user, {
          from_user: req.session.user,
          message: req.body.message,
          place: sentPlace
        }, eachCb);
      }, callback);
    }
  ], function(err) {
    if (err && !responded) return response(req, res, 500, err);
  });
};

exports.remove = function(req, res) {
  var result = req.session.user.places.pull(req.params.placeId);
  req.session.user.save(function(err) {
    if (err) response(req, res, 500);
    else response(req, res, 200);
  });
};
