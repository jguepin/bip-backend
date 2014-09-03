var request = require('request');

var config = require('../config');

exports.search = function(req, res) {
  request.get({
    url: 'https://maps.googleapis.com/maps/api/place/textsearch/json',
    qs: {
      key: config.googleApiKey,
      query: req.query.query
    }
  }, function(error, response, body) {
    if (error) res.status(500).send(error);

    body = JSON.parse(body);
    res.send(body);
  });
};
