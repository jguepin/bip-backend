var request = require('request'),
    _ = require('underscore');

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
