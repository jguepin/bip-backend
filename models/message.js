var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MessageSchema = new Schema({
  created: { type: Date, default: Date.now },
  from_user: { type: Schema.ObjectId, ref: 'User' },
  to_users: [{ type: Schema.ObjectId, ref: 'User' }],
  place: { type: Schema.ObjectId, ref: 'Place' },
  content: String,
  is_read: { type: Boolean, default: false }
});

module.exports = mongoose.model('Message', MessageSchema);
