var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var mongoose = require('mongoose');

var routes = require('./routes');
var config = require('./config');

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
  var port = process.env.PORT || 3000;
  app.listen(port, function() {
    console.log('Application running on port ' + port);
  });
});
