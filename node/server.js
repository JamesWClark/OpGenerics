var fs          = require('fs');            // file systems
var jws         = require('jws');           // json web signatures
var jwt         = require('jsonwebtoken');  // json web tokens
var http        = require('http');          // http protocol
var moment      = require('moment');        // time library
// var corser      = require('corser');        // cross origin support
var express     = require('express');       // web server
var request     = require('request');       // http trafficer
var jwkToPem    = require('jwk-to-pem');    // converts json web key to pem
var bodyParser  = require('body-parser');   // http body parser
var Mongo       = require('mongodb').MongoClient; // MongoDB driver

const MONGO_URL = 'mongodb://localhost:27017/apcsp';
const CLIENT_ID = '955192429695-5dcrirs5op9vnq8a1t2tvrruhesqcvmc.apps.googleusercontent.com';

var keyCache = {};

// gets the google public keys and caches them in keyCache
function updateWellKnownKeys() {
  // get the well known config from google
  request('https://accounts.google.com/.well-known/openid-configuration', function(err, res, body) {
    var config    = JSON.parse(body);
    var address   = config.jwks_uri; // ex: https://www.googleapis.com/oauth2/v3/certs
    var timestamp = moment();
  
    // get public json web keys
    request(address, function(err, res, body) {
      keyCache.keys = JSON.parse(body).keys;
      keyCache.lastUpdate = timestamp;
      keyCache.timeToLive = timestamp.add(12, 'hours');
      log(timestamp.format('x') + ': cached google public keys ', keyCache.keys);
    });
  });
}

// cache google's public keys
updateWellKnownKeys();

// static MongoDB operations
Mongo.connect(MONGO_URL, function (err, db) {

  if (err) {
    log('MongoDB connection error');
  } else {
    log('Connected to MongoDB');
    
    Mongo.ops = {};
    
    Mongo.ops.insert = function (collection, json, callback) {
      var col = db.collection(collection);
      col.insert(json, function (err, result) {
        if (err) {
          log('insert error: ' + err);
        }
        else {
          log('insert success: ' + collection + ' = ', json);
        }
        if (callback) callback(err, result);
      });
    };
  }
});

// custom logging
var log = function(msg, obj) {
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
};

// http server
var app = express();

// body parsing ensures req.body property
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// allow requests across all domains
app.use(function(req, res, next) {
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
});

function getPem(keyID) {
  var jsonWebKeys = keyCache.keys.filter(function(key) {
    return key.kid === keyID;
  });
  return jwkToPem(jsonWebKeys[0]);
}

// authorize all request tokens
function authorize(req, res, next) {
  try {
    var token           = req.headers.authorization;
    var decoded         = jwt.decode(token, { complete : true });  // ex: http://www.jsonmate.com/permalink/57a0372c4fef248c399c5dd6        
    var keyID           = decoded.header.kid;
    var algorithm       = decoded.header.alg;
    var pem             = getPem(keyID);
    var signature       = decoded.signature;
    
    var options = {
      audience : CLIENT_ID,
      issuer : 'accounts.google.com',
      algorithms : [ algorithm ]
    }
    
    jwt.verify(token, pem, options, function(err) {
      if(err) {
        res.writeHead(401);
        res.end();
      } else {
        log('VALID');
        next();
      }
    });

  } catch(err) {
    res.writeHead(401);
    res.end();
  }
}

/*
function validateIdToken(idToken) {
  var decoded = jwt.decode(idToken, { complete : true });
  var options = {
    'audience'    : CLIENT_ID,
    'issuer'      : 'accounts.google.com',
    'algorithms'  : [ decoded.header.alg ]
  }
}
*/

app.use(authorize);

app.post('/login', function (req, res) {
  log('req.body = ', req.body);
  //Mongo.ops.insert('login', req.body);
  res.status(201).send('ok');
});

// listen on port 3000
app.listen(3000);

log('listening on port 3000');
