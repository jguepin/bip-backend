// Module to query Foursquare API

var request = require('request');

var config = require('../config');

exports.searchPlaces = function(query, location, callback) {
  return request.get({
    url: 'https://api.foursquare.com/v2/venues/search',
    qs: {
      client_id: config.foursquare.clientId,
      client_secret: config.foursquare.clientSecret,
      v: config.foursquare.version,
      query: query,
      ll: location || undefined,
      radius: location && 1000 || undefined,
      intent: location ? 'browse' : 'global'
    }
  }, function(err, res, searchBody) {
    if (err) {
      return callback(err);
    }

    searchBody = JSON.parse(searchBody);
    return callback(null, searchBody.response.venues);
  });
};

exports.nearbyPlaces = function(location, callback) {
  return request.get({
    url: 'https://api.foursquare.com/v2/venues/search',
    qs: {
      client_id: config.foursquare.clientId,
      client_secret: config.foursquare.clientSecret,
      v: config.foursquare.version,
      ll: location,
      radius: location && 500,
      intent: 'checkin'
    }
  }, function(err, res, nearbyBody) {
    if (err) {
      return callback(err);
    }

    nearbyBody = JSON.parse(nearbyBody);
    return callback(null, nearbyBody.response.venues);
  });
};

exports.getPlaceDetails = function(place, callback) {
  return request.get({
    url: 'https://api.foursquare.com/v2/venues/' + place.id,
    qs: {
      client_id: config.foursquare.clientId,
      client_secret: config.foursquare.clientSecret,
      v: config.foursquare.version
    }
  }, function(err, res, placeBody) {
    if (err) {
      return callback(err);
    }

    placeBody = JSON.parse(placeBody);
    return callback(null, placeBody.response.venue);
  });
};
