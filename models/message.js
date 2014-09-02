var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MessageSchema = new Schema({
  type: String,
  created: Date,
  from_user: { type: Schema.ObjectId, ref: 'User' },
  to_users: [{ type: Array, ref: 'User' }],
  place: { type: Schema.ObjectId, ref: 'Place' },
  content: String,
  is_read: Boolean
});

module.exports = mongoose.model('Message', MessageSchema);
