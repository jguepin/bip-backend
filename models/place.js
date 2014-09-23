var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    _ = require('lodash');

var config = require('../config');

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
  hours: {},
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
  place.address = placeItem.formatted_address;
  place.latitude = placeItem.geometry && placeItem.geometry.location && placeItem.geometry.location.lat || undefined;
  place.longitude = placeItem.geometry && placeItem.geometry.location && placeItem.geometry.location.lng || undefined;
  place.price = placeItem.price_level;
  if (placeItem.opening_hours && placeItem.opening_hours.periods) {
    place.hours = {};
    _.each(placeItem.opening_hours.periods, function(period) {
      place.hours[period.open.day] = { open: period.open.time, close: period.close.time };
    });
  }

  place.phone = placeItem.international_phone_number;

  place.photos = _.map(placeItem.photos, function(photo) {
    return {
      url: 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=' + photo.width + '&photoreference=' + photo.photo_reference + '&key=' + config.googleApiKey,
      width: photo.width,
      height: photo.height
    };
  });

  place._id = undefined;

  return place;
};

module.exports = mongoose.model('Place', PlaceSchema);
