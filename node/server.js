var http = require('http');
var Mongo = require('mongodb').MongoClient;
var express = require('express');

var mongo_url = 'mongodb://localhost:27017/myapp';

function log(msg) {
  console.log(msg);
}

Mongo.connect(mongo_url, function(err, db) {
  if(err) {
    log('MongoDB connection error');
  } else {
    log('Connected to MongoDB');
  }
});