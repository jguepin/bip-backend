module.exports = {
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/town',
  googleApiKey: process.env.GOOGLE_KEY || 'AIzaSyCqsC2DXaAFg8xVBhLBeudM944GiTuGF8Q',
  foursquare: {
    clientId: process.env.FOURSQUARE_CLIENT_ID || 'VW2JSE3TSAIYMX410V1SNJJEEGEEYKZ0CV5PJK0XFIOLJVRP',
    clientSecret: process.env.FOURSQUARE_CLIENT_SECRET || 'YO0D1ITR4JC5HSJXBZWTAO3XBGHWH11CCRG4KYIRTD0ECLAM',
    version: '20141001'
  },
  placesApi: process.env.PLACES_API || 'foursquare',
  concurrency: process.env.WEB_CONCURRENCY || 1
};
