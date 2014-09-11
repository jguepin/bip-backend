var request = require('request'),
    _ = require('lodash'),
    async = require('async');

var config = require('../config'),
    response = require('../helpers').response,
    Place = require('../models/place');

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
    var next = body.next_page_token;

    response(res, 200, places, next);
  });
};

exports.save = function(req, res) {
  async.waterfall([
    function(callback) {
      Place
        .findOne({ place_id: req.body.place_id })
        .exec(function(err, place) {
          if (err) return callback(err);

          if (place) {
            // Place already saved in our db, affect it the user
            return callback(null, place);
          } else {
          // The place is not saved in our db yet, save it!
            var newPlace = new Place();
            newPlace.place_id = req.body.place_id;
            newPlace.name = req.body.name;
            newPlace.location = req.body.location;
            newPlace.type = req.body.type;
            newPlace.address = req.body.address;
            newPlace.score = req.body.score;
            newPlace.save(function(err) {
              callback(err, newPlace);
            });
          }
      });
    },
    function(place, callback) {
      // Save the place in the users places
      var added = req.session.user.places.addToSet(place._id);
      if (added.length) {
        req.session.user.save(function(err) {
          callback(err);
        });
      } else {
        callback();
      }
    }
  ], function(err, results) {
    if (err) return response(res, 500, err);

    return response(res, 200);
  });
};

exports.remove = function(req, res) {
  var result = req.session.user.places.pull(req.params.placeId);
  req.session.user.save(function(err) {
    if (err) response(res, 500);
    else response(res, 200);
  });
};
