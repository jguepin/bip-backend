var User = require('./models/user');

// Wrap all API responses in an envelope
var response = exports.response = function(res, code, data, next) {
  var envelope = {};

  if (code === 200) {
    envelope.status = 'success';
    envelope.data = data || null;
    envelope.next = next || null;
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

  // User is authenticated and has already been stored in the session
  if (req.session.user) {
    return next();
  }

  var token = req.get('Authorization');
  if (!token) return handleAuthError();

  // Lookup for this token in the users db
  User
    .findOne({ token: token })
    .exec(function(err, user) {
      if (err || !user) return handleAuthError();

      req.session.user = user;
      next();
  });
};
