var Db = require('mongodb').Db,
    Server = require('mongodb').Server,
    MongoClient = require('mongodb').MongoClient,
    format = require('util').format,
    assert = require('assert'),
    credentials = require('./credentials');

var database = null;
var open = false;

var conf = {
    database: "Tworpus",
    collection: "tweets",
    cacheCollection: "cache",
    port: "27017",
    host: "127.0.0.1",

    createConnection: function(cb) {
        if(database === null)
            database = new Db(conf.database, new Server(conf.host, conf.port), { auto_reconnect: true });
        if(!open) {
            database.open(function(err, db) {
                assert.equal(err, null);
                db.authenticate(credentials.user, credentials.pw, function() {
                    open = true;
                    database = db;
                    db.collection("tweets").ensureIndex( { "timestamp": -1 } );
                    if(cb) cb(db);
                });
            });
        }
        else database.authenticate(credentials.user, credentials.pw, function() {
            cb(database);
        });
    }

};

exports.DbConf = conf;