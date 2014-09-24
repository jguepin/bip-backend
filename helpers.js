var _ = require('lodash');

// Modify the toJSON method to modify the exposed object
exports.makeExposable = function(model, exposable) {
  model.prototype._toJSON = model.prototype.toJSON;
  model.prototype.toJSON = function() {
    var json = this._toJSON();
    var exposed = {};
    _.each(_.keys(exposable), function(key) {
      exposed[key] = json[exposable[key]];
    });
    return exposed;
  };
};

// Wrap all API responses in an envelope
var response = exports.response = function(res, code, data, next) {
  var envelope = {};

  if (code === 200) {
    envelope.status = 'success';
    envelope.data = data || null;
    if (next) envelope.next = next;
  } else {
    envelope.status = 'error';
    envelope.message = data || 'Internal Server Error';
  }

  res.status(code).send(envelope);
};

// Middleware to check if the user is authenticated
exports.requireLogin = function(req, res, next) {
  // Return a 401 if not authenticated, don't go to next middleware
  var handleAuthError = function() {
    response(res, 401, 'Authentication required');
  };

  var token = req.get('Authorization');
  if (!token) return handleAuthError();

  // Lookup for this token in the users db
  var User = require('./models/user');
  User
    .findOne({ token: token })
    .exec(function(err, user) {
      if (err || !user) return handleAuthError();

      req.session.user = user;
      next();
  });
};
