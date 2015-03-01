var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NotificationSchema = new Schema({
  created: { type: Date, default: Date.now },
  to_user: { type: Schema.ObjectId, ref: 'User' },
  from_user: { type: Schema.ObjectId, ref: 'User' },
  place: { type: Schema.ObjectId, ref: 'Place' },
  message: String,
  is_read: { type: Boolean, default: false }
});

module.exports = mongoose.model('Notification', NotificationSchema);
