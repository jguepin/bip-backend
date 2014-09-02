var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PlaceSchema = new Schema({
  created: Date,
  name: String,
  type: String,
  address: String,
  location: String,
  price: Number,
  hours: String,
  score: Number,
  phone: String,
  photos: [{ url: String, width: Number, height: Number }]
});

module.exports = mongoose.model('Place', PlaceSchema);
