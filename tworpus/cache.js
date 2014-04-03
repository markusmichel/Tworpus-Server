var moment = require('moment'),
    twitterDb = require("./TweetFetcher").TwitterDb,
    dbConf = require("../conf/db_conf").DbConf;

var languages = ["de", "en", "es", "it", "pt", "fr", "nl", "tr"];


exports.updateCacheTableForDay = function (day) {
    var date = moment(day).hours(0).minutes(0).seconds(0).milliseconds(0);

    var startTimestamp = date.valueOf();
    date.hours(23).minutes(59).seconds(59).milliseconds(999);
    var endTimestamp = date.valueOf();

    console.log("update tweets for ", startTimestamp);

    dbConf.createConnection(function (db) {
        var cacheCollection = db.collection(dbConf.cacheCollection);

        // Get cache collection entry for timestamp or create it if it doesn't exist yet
        cacheCollection.findOne({_id: startTimestamp}, function (err, data) {
            data = data || {};
            data.languages = data.languages || {};
            data._timestamp = startTimestamp;
            data._id = startTimestamp;
//            cacheCollection.save(data);

            var filter = {};
            filter.limit = Number.MAX_VALUE;
            filter.startDate = startTimestamp;
            filter.endDate = endTimestamp;

            var i = 0;
            var update = function () {
                var lang = languages[i++];
                if (typeof lang === "undefined") {
                    console.log("save tweet counts");
                    cacheCollection.save(data);
                    return;
                }

                insertInCacheTable(filter, lang, data, function () {
                    update();
                });
            };
            update();
        });
    });
};


/**
 *
 * @param filter
 * @param lang
 * @param entity cache collection entry to manipulate
 * @param callback finished callback function
 */
var insertInCacheTable = function (filter, lang, entity, callback) {
    var timestamp = filter.startDate;
    filter.languages = [lang];

    twitterDb.count(filter, function (count) {
        entity.languages[lang] = count;
        if (callback) callback();
    }, function () {});
};


//setTimeout(function() {
//    exports.updateCacheTableForDay(1396006408000);
//    exports.updateCacheTableForDay(1396108588000);
//    exports.updateCacheTableForDay(1396136029000);
//}, 500);