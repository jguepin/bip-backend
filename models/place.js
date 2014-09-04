var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PlaceSchema = new Schema({
  venueId: String, // Foursquare ID
  placeId: String, // Google Places ID
  created: Date,
  name: String,
  type: String,
  address: String,
  location: { longitude: Number, latitude: Number },
  price: Number,
  hours: String,
  score: Number,
  phone: String,
  photos: [{ url: String, width: Number, height: Number }]
});

PlaceSchema.statics.mapGoogleItem = function(placeItem) {
  var Place = mongoose.model('Place');
  var place = new Place();
  place.placeId = placeItem.place_id;
  place.name = placeItem.name;
  place.type = placeItem.types && placeItem.types.length && placeItem.types[0];
  place.location = placeItem.geometry && placeItem.geometry.location;
  place.address = placeItem.formatted_address;
  place.score = placeItem.rating;

  // TODO: photos, hours

  return place;
};

module.exports = mongoose.model('Place', PlaceSchema);
