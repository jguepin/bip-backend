var request = require('request'),
    _ = require('lodash'),
    async = require('async');

var config = require('../config'),
    response = require('../helpers').response,
    Place = require('../models/place'),
    Message = require('../models/message');

exports.search = function(req, res) {
  // Fetch search results from Google Places API
  request.get({
    url: 'https://maps.googleapis.com/maps/api/place/textsearch/json',
    qs: {
      key: config.googleApiKey,
      query: req.query.query
    }
  }, function(error, resp, body) {
    if (error) return response(res, 500, error);

    body = JSON.parse(body);

    // Parse Google response into something better
    var places = _.map(body.results, Place.mapGoogleItem);
    // Dirty fix to remove place _id on search
    places = _.map(places, function(place) {
      place = place.toObject();
      delete place._id;
      return place;
    });
    var next = body.next_page_token;

    response(res, 200, places, next);
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
        return response(res, 200);
      });
    } else {
      return response(res, 200);
    }
  });
};

exports.send = function(req, res) {
  getOrCreatePlace(req.body.place, function(err, place) {
    if (err) return response(res, 500, err);

    var message = new Message();
    message.from_user = req.session.user._id;
    message.place = place._id;
    message.content = req.body.content;
    message.to_users = req.body.to_users;
    message.save(function(err) {
      if (err) return response(res, 500, err);

      return response(res, 200);
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
