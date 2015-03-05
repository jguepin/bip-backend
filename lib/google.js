// Module to query Google Places API

var request = require('request');

var config = require('../config');

exports.searchPlaces = function(query, location, callback) {
  request.get({
    url: 'https://maps.googleapis.com/maps/api/place/textsearch/json',
    qs: {
      key: config.googleApiKey,
      query: query,
      location: location || undefined,
      radius: location && 1000 || undefined
    }
  }, function(err, res, searchBody) {
    if (err) return callback(err);

    searchBody = JSON.parse(searchBody);
    callback(null, searchBody.results, searchBody.next_page_token);
  });
};

exports.nearbyPlaces = function(location, callback) {
  request.get({
    url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
    qs: {
      key: config.googleApiKey,
      location: location,
      radius: 500
    }
  }, function(err, res, nearbyBody) {
    if (err) return callback(err);

    nearbyBody = JSON.parse(nearbyBody);
    callback(null, nearbyBody.results, nearbyBody.next_page_token);
  });
};

exports.getPlaceDetails = function(place, callback) {
  request.get({
    url: 'https://maps.googleapis.com/maps/api/place/details/json',
    qs: {
      key: config.googleApiKey,
      placeid: place.google_id
    }
  }, function(err, resp, placeBody) {
    if (err) return callback(err);

    placeBody = JSON.parse(placeBody);
    return callback(null, placeBody.result);
  });
};
