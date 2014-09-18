var request = require('request'),
    _ = require('lodash'),
    async = require('async');

var config = require('../config'),
    response = require('../helpers').response,
    Place = require('../models/place'),
    Notification = require('../models/notification');

exports.search = function(req, res) {
  // Fetch search results from Google Places API
  request.get({
    url: 'https://maps.googleapis.com/maps/api/place/textsearch/json',
    qs: {
      key: config.googleApiKey,
      query: req.query.query,
      location: req.query.location || undefined,
      radius: req.query.location && 1000 || undefined
    }
  }, function(error, resp, searchBody) {
    if (error) return response(res, 500, error);

    searchBody = JSON.parse(searchBody);

    async.map(searchBody.results, function(place, callback) {
      // Get detailed information about the place from Google Places API
      request.get({
        url: 'https://maps.googleapis.com/maps/api/place/details/json',
        qs: {
          key: config.googleApiKey,
          placeid: place.place_id
        }
      }, function(err, resp, placeBody) {
        placeBody = JSON.parse(placeBody);
        // Return a parsed version of the place
        callback(err, Place.mapGoogleItem(placeBody.result));
      });
    }, function(err, places) {
      if (err) return response(res, 500, err);

      response(res, 200, places, searchBody.next_page_token);
    });
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
    if (err) return response(res, 500, err);

    // Save the place in the user places
    var added = req.session.user.places.addToSet(place._id);
    if (added.length) {
      req.session.user.save(function(err) {
        if (err) return response(res, 500, err);
        return response(res, 200);
      });
    } else {
      return response(res, 200);
    }
  });
};

exports.send = function(req, res) {
  getOrCreatePlace(req.body.place, function(err, place) {
    if (err || !place) return response(res, 500, err);

    // Send a notification to all destination users
    async.each(req.body.to_users, function(to_user_id, callback) {
      var notif = new Notification();
      notif.from_user = req.session.user._id;
      notif.place = place._id;
      notif.message = req.body.message;
      notif.to_user = to_user_id;
      notif.save(callback);

    }, function(err) {
      if (err) return response(res, 500, err);

      // Save the place in the sender places
      var added = req.session.user.places.addToSet(place._id);
      if (added.length) {
        req.session.user.save(function(err) {
          if (err) return response(res, 500, err);
          return response(res, 200);
        });
      } else {
        return response(res, 200);
      }
    });
  });
};

exports.remove = function(req, res) {
  var result = req.session.user.places.pull(req.params.placeId);
  req.session.user.save(function(err) {
    if (err) response(res, 500);
    else response(res, 200);
  });
};
