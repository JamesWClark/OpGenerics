var fs          = require('fs');                    // file systems
var jwt         = require('jsonwebtoken');          // json web tokens
var http        = require('http');                  // http protocol
var moment      = require('moment');                // time library
var express     = require('express');               // web server
var request     = require('request');               // http trafficer
var jwkToPem    = require('jwk-to-pem');            // converts json web key to pem
var bodyParser  = require('body-parser');           // http body parser
var Mongo       = require('mongodb').MongoClient;   // MongoDB driver

const MONGO_URL = 'mongodb://localhost:27017/apcsp';
const CLIENT_ID = '955192429695-5dcrirs5op9vnq8a1t2tvrruhesqcvmc.apps.googleusercontent.com';

var keyCache = {}; // public key cache

/**
 * Cache Google's well known public keys
 */
function cacheWellKnownKeys() {
  
  // get the well known config from google
  request('https://accounts.google.com/.well-known/openid-configuration', function(err, res, body) {
    var config    = JSON.parse(body);
    var address   = config.jwks_uri; // ex: https://www.googleapis.com/oauth2/v3/certs

    // get the public json web keys
    request(address, function(err, res, body) {

      keyCache.keys = JSON.parse(body).keys;

      // example cache-control header: 
      // public, max-age=24497, must-revalidate, no-transform
      var cacheControl = res.headers['cache-control'];      
      var values = cacheControl.split(',');
      var maxAge = parseInt(values[1].split('=')[1]);
      
      // update the key cache when the max age expires
      setTimeout(cacheWellKnownKeys, maxAge * 1000);
      
      log('Cached keys = ', keyCache.keys);      
    });
  });
}

// call the above function
cacheWellKnownKeys();

/**
 * MongoDB operations
 * connects to MongoDB and registers a series of asynchronous methods
 */
Mongo.connect(MONGO_URL, function (err, db) {

  Mongo.ops = {};

  Mongo.ops.insert = function (collection, json, callback) {
    var c = db.collection(collection);
    c.insert(json, function (err, result) {
      if (err) {
        log('Mongo.ops.insert error = ' + err);
      } else {
        log('Mongo.ops.insert success = ' + collection + ' = ', json);
      }
      if (callback) callback(err, result);
    });
  };
  
  Mongo.ops.upsert = function(collection, query, json, callback) {
	var c = db.collection(collection);
	c.updateOne(query, { $set : json }, { upsert : true }, function (err, result) {
      if(err) {
        log('Mongo.ops.upsert error = ', err);
      } else {
        log('Mongo.ops.upsert success = ' + collection + ' = ', result);
      }
      if (callback) callback(err, result);
    });
  };
});

/**
 * Converts json web key to pem key
 */
function getPem(keyID) {
  var jsonWebKeys = keyCache.keys.filter(function(key) {
    return key.kid === keyID;
  });
  return jwkToPem(jsonWebKeys[0]);
}

/**
 * Middleware:
 * allows cross domain requests
 * ends preflight checks
 */
function allowCrossDomain(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  
  // end pre flights
  if(req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
  } else {
    next();
  }
}

/**
 * Middlware:
 * validate tokens and authorize users
 */
function authorize(req, res, next) {
  
  // jwt.decode: https://github.com/auth0/node-jsonwebtoken#jwtdecodetoken--options
  // jwt.verify: https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback
  
  try {
    var token           = req.headers.authorization;
    var decoded         = jwt.decode(token, { complete : true });       
    var keyID           = decoded.header.kid;
    var algorithm       = decoded.header.alg;
    var pem             = getPem(keyID);
    var signature       = decoded.signature;
    
    var options = {
      audience          : CLIENT_ID,
      issuer            : 'accounts.google.com',
      algorithms        : [ algorithm ]
    }

    jwt.verify(token, pem, options, function(err) {
      if(err) {
        res.writeHead(401);
        res.end();
      } else {
        next();
      }
    });

  } catch(err) {
    res.writeHead(401);
    res.end();
  }
}

// web server
var app = express();

// use middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(allowCrossDomain);
app.use(authorize);

app.post('/login', function (req, res) {
  log('/login req.body = ', req.body);
  var query = { id : req.body.id };
  Mongo.ops.upsert('login', query, req.body);
  res.status(201).send('ok');
});

// listen on port 3000
app.listen(3000);

log('listening on port 3000');



/**
 * Custom logger to prevent circular reference in JSON.parse(obj)
 */
function log(msg, obj) {
    console.log('\n');
    if(obj) {
        try {
            console.log(msg + JSON.stringify(obj));
        } catch(err) {
            var simpleObject = {};
            for (var prop in obj ){
                if (!obj.hasOwnProperty(prop)){
                    continue;
                }
                if (typeof(obj[prop]) == 'object'){
                    continue;
                }
                if (typeof(obj[prop]) == 'function'){
                    continue;
                }
                simpleObject[prop] = obj[prop];
            }
            console.log('circular-' + msg + JSON.stringify(simpleObject)); // returns cleaned up JSON
        }        
    } else {
        console.log(msg);
    }
}
