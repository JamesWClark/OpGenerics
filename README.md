# OpGenerics

Take advantage of JavaScript's interpreted nature with these lightweight generic operations

## MongoDB - (w/ Node.js Driver)

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
  
## HTTP (w/ jQuery)

	var http = {};

	http.post = function(url, json, success, error) {
		$.ajax({
			url: route(url),
			method: 'POST',
			data: json,
			headers: {
				'Authorization': authResponse.id_token
			},
			success: function(data, statusText, jqXHR) {
				if (success) success(data, statusText, jqXHR);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if (error) error(jqXHR, textStatus, errorThrown);
			}
		});
	};

	http.get = function(url, success, error) {
		$.ajax({
			url: route(url),
			method: 'GET',
			headers: {
				'Authorization': authResponse.id_token
			},
			success: function(data, statusText, jqXHR) {
				if (success) success(data, statusText, jqXHR);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if (error) error(jqXHR, textStatus, errorThrown);
			}
		});
	};

	http.put = function(url, json, success, error) {
		$.ajax({
			url: route(url),
			method: 'PUT',
			data: json,
			headers: {
				'Authorization': authResponse.id_token
			},
			success: function(data, statusText, jqXHR) {
				if (success) success(data, statusText, jqXHR);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if (error) error(jqXHR, textStatus, errorThrown);
			}
		});
	};

	http.delete = function(url, success, error) {
		$.ajax({
			url: route(url),
			method: 'DELETE',
			headers: {
				'Authorization': authResponse.id_token
			},
			success: function(data, statusText, jqXHR) {
				if (success) success(data, statusText, jqXHR);
			},
			error: function(jqXHR, textStatus, errorThrown) {
				if (error) error(jqXHR, textStatus, errorThrown);
			}
		});
	};
