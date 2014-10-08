var async = require('async');

var google = require('../lib/google'),
    push_notifications = require('../lib/push_notifications'),
    response = require('../helpers').response,
    Place = require('../models/place'),
    Notification = require('../models/notification'),
    User = require('../models/user');

var searchCallback = function(err, places, next, req, res) {
  if (err) return response(req, res, 500, err);

  async.map(places, function(place, callback) {
    // Get detailed information about the place from Google Places API
    google.getPlaceDetails(place.place_id, function(err, placeBody) {
      if (err) return callback(err);
      // Return a parsed version of the place
      callback(null, Place.mapGoogleItem(placeBody));
    });
  }, function(err, places) {
    if (err) return response(req, res, 500, err);

    response(req, res, 200, places, next);
  });
};

exports.textSearch = function(req, res) {
  google.searchPlaces(req.query.query, req.query.location, function(err, places, next) {
    searchCallback(err, places, next, req, res);
  });
};

exports.nearbySearch = function(req, res) {
  google.nearbyPlaces(req.query.location, function(err, places, next) {
    searchCallback(err, places, next, req, res);
  });
};

var getOrCreatePlace = function(placeData, callback) {
  if (placeData._id) {
    // It's a place from our DB
    Place
      .findOne({ _id: placeData._id })
      .exec(function(err, place) {
        if (err || !place) return callback(err || 'Place not found.');
        return callback(null, place);
      });

  } else if (placeData.place_id) {
    // It's a place from Google Places
    Place
      .findOne({ place_id: placeData.place_id })
      .exec(function(err, place) {
        if (err) return callback(err);

        if (place) {
          // Place already saved in our db
          return callback(null, place);
        } else {
        // The place is not saved in our db yet, save it!
          place = new Place();
          place.place_id = placeData.place_id;
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
  } else {
    return callback('Missing parameter!');
  }
};

exports.save = function(req, res) {
  getOrCreatePlace(req.body, function(err, place) {
    if (err) return response(req, res, 500, err);

    // Save the place in the user places
    req.session.user.savePlace(place._id, function(err) {
      if (err) return response(req, res, 500, err);
      return response(req, res, 200);
    });
  });
};

exports.send = function(req, res) {
  getOrCreatePlace(req.body.place, function(err, place) {
    if (err || !place) return response(req, res, 500, err);

    // Send a notification to all destination users
    async.each(req.body.to_users, function(to_user_id, callback) {
      var notif = new Notification();
      notif.from_user = req.session.user._id;
      notif.place = place._id;
      notif.message = req.body.message;
      notif.to_user = to_user_id;
      notif.save(callback);

    }, function(err) {
      if (err) return response(req, res, 500, err);

      // Save the place in the sender places
      req.session.user.savePlace(place._id, function(err) {
        if (err) return response(req, res, 500, err);
        response(req, res, 200);

        // The response has been sent to the user, we can send push notifications to destination users devices in background
        User
          .find({ _id: { $in: req.body.to_users }})
          .exec(function(err, users) {
            if (!err && users.length) {
              async.each(users, function(user, callback) {
                push_notifications.sendPushNotification(user, {
                  from_user: req.session.user._id,
                  message: req.body.message,
                  place: place._id
                }, callback);
              });
            }
          });
      });
    });
  });
};

exports.remove = function(req, res) {
  var result = req.session.user.places.pull(req.params.placeId);
  req.session.user.save(function(err) {
    if (err) response(req, res, 500);
    else response(req, res, 200);
  });
};
