var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt');

var makeExposable = require('../helpers').makeExposable;

var UserSchema = new Schema({
  email: { type: String, required: true, match: /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/ },
  username: { type: String, required: true, unique: true },
  password: { type: String, require: true },
  token: { type: String, unique: true },
  home_city: { type: String },
  contacts: [{ type: Schema.ObjectId, ref: 'User' }],
  places: [{ type: Schema.ObjectId, ref: 'Place' }]
});


UserSchema.methods.verifyPassword = function(password, callback) {
  bcrypt.compare(password, this.password, callback);
};

UserSchema.methods.savePlace = function(placeId, callback) {
  // Save the place in user places
  var added = this.places.addToSet(placeId);
  if (added.length) {
    this.save(callback);
  } else {
    callback();
  }
};

var User = mongoose.model('User', UserSchema);
makeExposable(User, function(json, context) {
  var isSelf = context.session.user._id.toString() === json._id.toString();
  return {
    _id: json._id,
    email: json.email,
    username: json.username,
    token: isSelf ? json.token : undefined
  };
});

module.exports = User;
