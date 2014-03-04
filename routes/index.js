/*
 * GET home page.
 */

var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;

exports.index = function(req, res){

    MongoClient.connect('mongodb://127.0.0.1:27017/Tworpus', function(err, db) {
        if(err) throw err;

        var collection = db.collection('Node_Tweet');


        var length = collection.find({}).count(function(err, count) {
            res.render('index', { length: count });
            db.close();
        });
    });

};