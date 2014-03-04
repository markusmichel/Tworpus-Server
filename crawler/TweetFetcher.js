var DbConfig = require('../conf/db_conf').DbConf,
    assert = require("assert");

function TwitterDb() {
    this.collectionName = DbConfig.collection;
    this.DatabaseName = DbConfig.database;
    this.db = DbConfig.createConnection;
}

TwitterDb.prototype.getNumTweets = function(callback, errcb) {
    var that = this;
    this.db(function(err, db) {
        db.collection(that.collectionName).find({}).count(function(err, count) {
            assert.equal(err, null, "Error retrieving data");
            callback(count);
        });
    });
};

/**
 * Find Tweets specified by filter parameters.
 * Parameters are:
 * - languages: array. ex: ['de', 'en']
 * - limit: int. Dedault 100
 * - startDate: timestamp
 * - endDate: timestamp
 * @param callback
 */
TwitterDb.prototype.find = function(filterParams, callback, errcb) {
    filterParams = filterParams || {};
    filterParams.languages = filterParams.languages || [];
    filterParams.limit = filterParams.limit || 100;
    filterParams.startDate = parseInt(filterParams.startDate) || undefined;
    filterParams.endDate = parseInt(filterParams.endDate) || undefined;

    var filter = {};
    filter.$and = [];
    filter.$and.push({wordcount: {$gte: filterParams.wordcount}});
    filter.$and.push({charcount: {$gte: filterParams.charcount}});
    if(filterParams.startDate) filter.$and.push({timestamp: {$gte: filterParams.startDate}});
    if(filterParams.endDate)   filter.$and.push({timestamp: {$lte: filterParams.endDate}});

    if(filterParams.languages.length > 0) {
        var langFilter = {$or: []};
        for(var i in filterParams.languages)
            langFilter.$or.push({language: filterParams.languages[i]});

        filter.$and.push(langFilter);
    }

    console.log(filterParams);
    console.log(filter);

    var that = this;
    this.db(function(db) {
        db.collection(that.collectionName)
            .find(filter)
            .limit(filterParams.limit)
            .toArray(function(err, data) {
                if(err && errcb) {errcb(err); return;}
                else if(err) callback({status: "failed", error: "true"})
                callback(data);
        });
    });
}



exports.TwitterDb = new TwitterDb();