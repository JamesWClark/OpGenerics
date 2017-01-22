var http = require('http');
var Mongo = require('mongodb').MongoClient;
var express = require('express');
var bodyParser = require('body-parser');

var mongo_url = 'mongodb://localhost:27017/apcsp';

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

// static MongoDB operations
Mongo.connect(mongo_url, function (err, db) {

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

// http server
var app = express();

// body parsing ensures req.body property
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/', function (req, res) {
  res.send('hello');
});

app.post('/signin', function (req, res) {
  log('req.body = ', req);
  Mongo.ops.insert('signin', req.body);
  res.status(201).send('ok');
});

// listen on port 3000
app.listen(3000);

log('listening on port 3000');
