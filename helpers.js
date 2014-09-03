// Wrap all API responses in an envelope
exports.response = function(res, code, data) {
  var envelope = {};

  if (code === 200) {
    envelope.status = 'success';
    envelope.data = data || null;
  } else {
    envelope.status = 'error';
    envelope.message = data || 'Internal Server Error';
  }

  res.status(code).send(envelope);
};
