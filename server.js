var express = require('express'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    mongoose = require('mongoose');

var routes = require('./routes'),
    config = require('./config');

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 't0wn',
  resave: false,
  saveUninitialized: true
}));

routes.map(app);

mongoose.connect(config.mongoUri);
mongoose.connection.once('open', function() {
  app.listen(process.env.PORT || 3000, function() {
    console.log('Application running on port ' + process.env.PORT || 3000);
  });
});
