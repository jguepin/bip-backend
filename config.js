module.exports = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/bip',
  googleApiKey: process.env.GOOGLE_KEY,
  foursquare: {
    clientId: process.env.FOURSQUARE_CLIENT_ID,
    clientSecret: process.env.FOURSQUARE_CLIENT_SECRET,
    version: '20141001'
  },
  placesApi: process.env.PLACES_API || 'foursquare',
  concurrency: process.env.WEB_CONCURRENCY || 1
};
