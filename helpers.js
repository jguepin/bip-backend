var _ = require('lodash');
var async = require('async');
var rarity = require('rarity');

// Modify the toJSON method to modify the exposed object
// TODO: find a better way to traverse objects recursively and transform properties
exports.makeExposable = function(model, expose) {
  model.prototype._toJSON = model.prototype.toJSON;
  model.prototype.toJSON = function() {
    var json = this._toJSON();
    json.expose = expose;
    return json;
  };
};

var stringify = function(object, context) {
  return JSON.stringify(object, function(key, value) {
    if (value && typeof value.expose === 'function') {
      return value.expose(value, context);
    }
    return value;
  });
};

// Wrap all API responses in an envelope
var response = exports.response = function(req, res, code, data, next) {
  var envelope = {};

  if (code === 200) {
    envelope.status = 'success';
    envelope.data = data && JSON.parse(stringify(data, req)) || null;
    if (next) envelope.next = next;
  } else {
    if (code === 400 && !data) {
      data = 'Missing field.';
    }
    console.error(data);
    envelope.status = 'error';
    envelope.message = data || 'Internal Server Error';
  }

  res.status(code).send(envelope);
};

// Middleware to check if the user is authenticated
exports.requireLogin = function(req, res, next) {
  async.waterfall([
    function(callback) {
      var token = req.get('Authorization');
      if (!token) callback('auth');

      // Lookup for this token in the users db
      var User = require('./models/user');
      User.findOne({ token: token }).exec(rarity.slice(2, callback));
    },
    function(user, callback) {
      if (!user) return callback('auth');
      req.session.user = user;
      callback();
    }
  ], function(err) {
    // Return a 401 if not authenticated, don't go to next middleware
    if (err === 'auth') return response(req, res, 401, 'Authentication required');
    if (err) return response(req, res, 500);

    next();
  });
};
