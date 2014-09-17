var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PlaceSchema = new Schema({
  venue_id: String, // Foursquare ID
  place_id: String, // Google Places ID
  created: { type: Date, default: Date.now },
  name: String,
  type: String,
  address: String,
  latitude: Number,
  longitude: Number,
  price: Number,
  hours: String,
  score: Number,
  phone: String,
  photos: [{ url: String, width: Number, height: Number }]
});

PlaceSchema.statics.mapGoogleItem = function(placeItem) {
  var Place = mongoose.model('Place');
  var place = new Place();
  place.place_id = placeItem.place_id;
  place.name = placeItem.name;
  place.type = placeItem.types && placeItem.types.length && placeItem.types[0];
  place.latitude = placeItem.geometry && placeItem.geometry.location && placeItem.geometry.location.lat || undefined;
  place.longitude = placeItem.geometry && placeItem.geometry.location && placeItem.geometry.location.lng || undefined;
  place.address = placeItem.formatted_address;

  // TODO: photos, hours

  return place;
};

module.exports = mongoose.model('Place', PlaceSchema);
