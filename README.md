# town-backend

The Town backend is a Node.js server exposing an API using Express.js framework, storing data in MongoDB.

## Requirements

 * [Node.js](http://nodejs.org)
 * [MongoDB](http://www.mongodb.org)

## Installation

On OSX, install Node.js and Mongo using [Homebrew](http://brew.sh):

```
brew update
brew install node mongodb
```
Install the Node modules dependencies (as defined in `package.json`):

```
npm install
```

## Run

Run MongoDB:

```
mongod
```

Run the Town backend:
```
node server.js
```

## TODO

* Support Foursquare API
* Return Town URLs for places photos, not to expose our API key
* Cleanup models exposition method
* Endpoint to set a notification as read
