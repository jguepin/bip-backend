// Module to query Foursquare API

var request = require('request');

var config = require('../config');

exports.searchPlaces = function(query, location, callback) {
  request.get({
    url: 'https://api.foursquare.com/v2/venues/search',
    qs: {
      client_id: config.foursquareClientId,
      client_secret: config.foursquareClientSecret,
      query: query,
      ll: location || undefined,
      radius: location && 1000 || undefined,
      intent: location ? 'browse' : 'global'
    }
  }, function(err, res, searchBody) {
    if (err) return callback(err);

    searchBody = JSON.parse(searchBody);
    callback(null, searchBody);
  });
};

exports.nearbyPlaces = function(location, callback) {
  request.get({
    url: 'https://api.foursquare.com/v2/venues/search',
    qs: {
      client_id: config.foursquareClientId,
      client_secret: config.foursquareClientSecret,
      ll: location,
      radius: location && 500,
      intent: 'checkin'
    }
  }, function(err, res, nearbyBody) {
    if (err) return callback(err);

    nearbyBody = JSON.parse(nearbyBody);
    callback(null, nearbyBody);
  });
};

exports.getPlaceDetails = function(placeId, callback) {
  request.get({
    url: 'https://api.foursquare.com/v2/venues/' + placeId,
    qs: {
      client_id: config.foursquareClientId,
      client_secret: config.foursquareClientSecret,
    }
  }, function(err, res, placeBody) {
    if (err) return callback(err);

    placeBody = JSON.parse(placeBody);
    return callback(null, placeBody);
  });
};
