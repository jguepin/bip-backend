var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt');

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

module.exports = mongoose.model('User', UserSchema);
