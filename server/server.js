var fs = require('fs'); // file systems
var jwt = require('jsonwebtoken'); // json web tokens
var http = require('http'); // http protocol
var express = require('express'); // web server
var request = require('request'); // http trafficer
var jwkToPem = require('jwk-to-pem'); // converts json web key to pem
var bodyParser = require('body-parser'); // http body parser
var Mongo = require('mongodb').MongoClient; // MongoDB driver

var keyCache = {}; // public key cache

const MONGO_URL = 'mongodb://localhost:27017/opgen';
const CLIENT_ID = '955192429695-5dcrirs5op9vnq8a1t2tvrruhesqcvmc.apps.googleusercontent.com';

/**
 * MongoDB operations
 * connects to MongoDB and registers a series of asynchronous methods
 */
Mongo.connect(MONGO_URL, function(err, db) {
    
    // TODO: handle err

    Mongo.ops = {};
    
        
    Mongo.ops.find = function(collection, json, callback) {
        db.collection(collection).find(json).toArray(function(err, docs) {
            if(callback) callback(err, docs);
        });
    };
    
    Mongo.ops.findOne = function(collection, json, callback) {
        db.collection(collection).findOne(json, function(err, doc) {
            if(callback) callback(err, doc);
        });
    };

    Mongo.ops.insert = function(collection, json, callback) {
        db.collection(collection).insert(json, function(err, result) {
            if(callback) callback(err, result);
        });
    };

    Mongo.ops.upsert = function(collection, query, json, callback) {
        db.collection(collection).updateOne(query, { $set: json }, { upsert: true }, function(err, result) {
            if (callback) callback(err, result);
        });
    };
    
    Mongo.ops.updateOne = function(collection, query, json, callback) {
        db.collection(collection).updateOne(query, { $set : json }, function(err, result) {
            if(callback) callback(err, result);
        });
    };
    
    Mongo.ops.deleteOne = function(collection, query, callback) {
        db.collection(collection).deleteOne(query, function(error, result) {
            if(callback) callback(error, result);
        });
    };
    
    Mongo.ops.deleteMany = function(collection, query, callback) {
        db.collection(collection).deleteMany(query, function(error, result) {
            if(callback) callback(error, result);
        });
    };
});

// web server
var app = express();

// use middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(allowCrossDomain);
app.use(authorize);

app.post('/login', function(req, res) {
    var query = { id: req.body.id };
    Mongo.ops.upsert('login', query, req.body, function(error, result) {
      log('/login req.body = ', req.body);
      if(error) res.status(500).send(error);
      else res.status(201).send(result);      
    });
});

// listen on port 3000
app.listen(3000, function() {
    cacheWellKnownKeys();
    log('listening on port 3000');
});

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
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
    } else {
        next();
    }
}

/**
 * Middlware:
 * validate tokens and authorize users
 * https://developers.google.com/identity/sign-in/web/backend-auth#verify-the-integrity-of-the-id-token
 *  - 1. The ID token is properly signed by Google. Use Google's public keys (available in JWK or PEM format) to verify the token's signature.
 *  - 2. The value of `aud` in the ID token is equal to one of your app's client IDs. This check is necessary to prevent ID tokens issued to a malicious app being used to access data about the same user on your app's backend server.
 *  - 3. The value of `iss` in the ID token is equal to `accounts.google.com` or `https://accounts.google.com`.
 *  - 4. The expiry time `exp` of the ID token has not passed.
 *  - 5. If you want to restrict access to only members of your G Suite domain, verify that the ID token has an `hd` claim that matches your G Suite domain name.
 */
function authorize(req, res, next) {

    // jwt.decode: https://github.com/auth0/node-jsonwebtoken#jwtdecodetoken--options
    // jwt.verify: https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback

    try {
        var token       = req.headers.authorization;
        var decoded     = jwt.decode(token, { complete: true });
        var keyID       = decoded.header.kid;
        var algorithm   = decoded.header.alg;
        var iss         = decoded.payload.iss;
        var pem         = getPem(keyID);

        // 3. The value of `iss` in the ID token is equal to `accounts.google.com` or `https://accounts.google.com`.
        if (iss === 'accounts.google.com' || iss === 'https://accounts.google.com') {
            
            // 2. The value of `aud` in the ID token is equal to one of your app's client IDs.
            var options = {
                audience: CLIENT_ID,
                issuer: iss,
                algorithms: [algorithm]
            }

            // 1. The ID token is properly signed by Google
            jwt.verify(token, pem, options, function(err) {
                if (err) {
                    res.writeHead(401);
                    res.end();
                } else {
                    next();
                }
            });            

        } else {
            res.writeHead(401);
            res.end();
        }
    } catch (err) {
        res.writeHead(401);
        res.end();
    }
}

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
 * Cache Google's well known public keys
 */
function cacheWellKnownKeys() {

    // get the well known config from google
    request('https://accounts.google.com/.well-known/openid-configuration', function(err, res, body) {
        var config = JSON.parse(body);
        var address = config.jwks_uri; // ex: https://www.googleapis.com/oauth2/v3/certs

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

/**
 * Custom logger to prevent circular reference in JSON.parse(obj)
 */
function log(msg, obj) {
    console.log('\n');
    if (obj) {
        try {
            console.log(msg + JSON.stringify(obj));
        } catch (err) {
            var simpleObject = {};
            for (var prop in obj) {
                if (!obj.hasOwnProperty(prop)) {
                    continue;
                }
                if (typeof(obj[prop]) == 'object') {
                    continue;
                }
                if (typeof(obj[prop]) == 'function') {
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
