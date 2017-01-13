var http = require('http');
var Mongo = require('mongodb').MongoClient;
var express = require('express');

var mongoUrl = 'mongodb://localhost:27017/myapp';

Mongo.connect(mongoUrl, function(err, db) {

    if (err) {
        log('MongoDB connection error');
    } else {
        log('Connected to MongoDB');
    }

    Mongo.ops = {};

});

function log(msg) {
    console.log(msg);
}

var app = express();

app.get('/', function(req, res) {
    res.send('hello');
});

app.listen(3000, function() {
    log('listening on port 3000');
});