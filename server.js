var throng = require('throng');

var config = require('./config');

var start = function() {
  console.log('Started worker.');
  require('./app');

  process.on('SIGTERM', stop);
  process.on('uncaughtException', stop);
};

var stop = function(err) {
  if (err) console.error(err);

  console.log('Stopping worker.');
  process.exit(0);
};

throng(start, { workers: config.concurrency, lifetime: Infinity });
