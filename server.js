var express = require('express'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    mongoose = require('mongoose');

var routes = require('./routes');

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({ secret: 't0wn' }));

routes.map(app);

mongoose.connect('mongodb://localhost:27017/town');
mongoose.connection.once('open', function() {
  app.listen(3000, function() {
    console.log('Application running on port 3000.');
  });
});