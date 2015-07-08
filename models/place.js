var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('lodash');

var config = require('../config');

var photoDescription = {
  url: String,
  width: Number,
  height: Number
};
var PhotoSchema = new Schema({
  s: photoDescription,
  m: photoDescription,
  l: photoDescription
});

var PlaceSchema = new Schema({
  foursquare_id: { type: String, unique: true, sparse: true }, // Foursquare ID
  google_id: { type: String, unique: true, sparse: true }, // Google Places ID
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
  photos: [PhotoSchema]
});

var mapGoogleItem = function(placeItem) {
  var Place = mongoose.model('Place');
  var place = new Place();
  place.google_id = placeItem.place_id;
  place.name = placeItem.name;
  place.type = placeItem.types && placeItem.types.length && placeItem.types[0];
  place.address = placeItem.formatted_address;
  place.latitude = placeItem.geometry && placeItem.geometry.location && placeItem.geometry.location.lat || undefined;
  place.longitude = placeItem.geometry && placeItem.geometry.location && placeItem.geometry.location.lng || undefined;
  place.price = placeItem.price_level;
  if (placeItem.opening_hours && placeItem.opening_hours.periods) {
    place.hours = {};
    _.each(placeItem.opening_hours.periods, function(period) {
      place.hours[period.open.day] = { open: period.open && period.open.time, close: period.close && period.close.time };
    });
  }

  place.phone = placeItem.international_phone_number;

  place.photos = _.map(placeItem.photos, function(photo) {
    return {
      s: getGooglePhoto(photo, 160),
      m: getGooglePhoto(photo, 500),
      l: getGooglePhoto(photo, photo.width)
    };
  });

  place._id = undefined;

  return place;
};

var mapFoursquareItem = function(placeItem) {
  var Place = mongoose.model('Place');
  var place = new Place();
  place.foursquare_id = placeItem.id;
  place.name = placeItem.name;
  place.type = placeItem.categories && placeItem.categories[0] && placeItem.categories[0].name;
  place.address = placeItem.location && placeItem.location.formattedAddress;
  place.latitude = placeItem.location && placeItem.location.lat || undefined;
  place.longitude = placeItem.location && placeItem.location.lng || undefined;
  place.price = placeItem.price && placeItem.price.tier || undefined;
  place.phone = placeItem.contact.phone;

  if (placeItem.photos && placeItem.photos.groups && placeItem.photos.groups[0] && placeItem.photos.groups[0].items) {
    place.photos = _.map(placeItem.photos.groups[0].items, function(photo) {
      return {
        s: getFoursquarePhoto(photo, 100),
        m: getFoursquarePhoto(photo, 500),
        l: getFoursquarePhoto(photo)
      };
    });
  }

  if (placeItem.hours && placeItem.hours.timeframes) {
    place.hours = {};
    _.each(placeItem.hours.timeframes, function(timeframe) {
      place.hours[timeframe.days] = { open: timeframe.open[0].renderedTime };
    });
  }

  place._id = undefined;

  return place;
};

PlaceSchema.statics.mapItem = function(placeItem) {
  if (config.placesApi === 'foursquare') {
    return mapFoursquareItem(placeItem);
  } else {
    return mapGoogleItem(placeItem);
  }
};

function getGooglePhoto(photo, size) {
  return {
    url: 'https://maps.googleapis.com/maps/api/place/photo?maxwidth=' + size + '&photoreference=' + photo.photo_reference + '&key=' + config.googleApiKey,
    width: size,
    height: Math.round((photo.height * size) / photo.width)
  };
}

function getFoursquarePhoto(photo, size) {
  return {
    url: photo.prefix + (size ? 'width' + size : 'original') + photo.suffix,
    width: size || photo.width,
    height: size ? Math.round((photo.height * size) / photo.width) : photo.height
  };
}

module.exports = mongoose.model('Place', PlaceSchema);
