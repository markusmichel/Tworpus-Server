var dbConf = require('../conf/db_conf').DbConf,
    http = require('http'),
    https = require('https'),
    cheerio = require("cheerio"),
    twitterDb = require("../crawler/TweetFetcher").TwitterDb,
    Long = require('mongodb').Long,
    json2csv = require('json2csv');

/**
 * Returns indexed tweets.
 * Filter params:
 * - language: ISO-639 language code
 * - limit: Number of tweets to search
 */
exports.getTweets = function(req, res) {
    var limit = parseInt(req.query.limit) || 10,
        tweetCharCount = parseInt(req.query.charcount) || 0,
        tweetWordCount = parseInt(req.query.wordcount) || 0,
        startDate = req.query.startdate,
        enddate = req.query.enddate,
        lang  = req.query.language,
        langs = req.query.languages,
        fs = require('fs');

    var filter = {};
    if(langs) filter.languages = langs.split(',');
    filter.limit = limit;
    filter.wordcount = tweetWordCount;
    filter.charcount = tweetCharCount;
    filter.startDate = startDate;
    filter.endDate = enddate;

    var success = function(tweets) {
//        @TODO switch return format (json, csv...)
//        console.log(tweets)
//        res.send(tweets);
//        return;

        json2csv({data: tweets, fields: ['tweet_id', 'userid', 'language']}, function (err, csv) {
            if (err) console.log(err);
            console.log(csv);
            res.set('Content-disposition', 'attachment; filename=testing.csv');
            res.set('Content-Type', 'text/csv');
            res.send(csv);
        });

    };
    var error = function(err) {
        res.send(500, {error: "Failure during retrieving tweets"});
    };
    twitterDb.find(filter, success, error);
};

/**
 * Returns number of tweets by language.
 * Filter params:
 * - language: ISO-639 language codes
 */
exports.getTweetsCount = function(req, res) {
	var lang = req.params.language;
	var startDate = parseInt(req.query.startdate);
	var	endDate = parseInt(req.query.enddate);

	var filter = {};
	filter.$and = [{
		timestamp: {$gte: startDate}
	}, {
		timestamp: {$lte: endDate}
	}, {
		language: lang
	}];

	dbConf.createConnection(function(db) {
		var collection = db.collection(dbConf.collection);
		collection.find(filter).count(function(err, data) {
			res.send({count: data});
		});
	});

	var error = function(err) {
		res.send(500, {error: "Failure during retrieving tweets"});
	};
};

/**
 * Returns status of crawler
 */
exports.getCrawlStatus = function(req, res) {

	// time difference between now and newest tweet should be maximum one hour in ms
	var allowedTimeDiff = 3600000;
	var newestTs = 0;
	var status = 1;

	dbConf.createConnection(function(db) {
		var collection = db.collection(dbConf.collection);
			collection.find().limit(1).sort({timestamp: -1}).toArray(function(err, data) {
				newestTs = data[0].timestamp;
				if (new Date().getTime() - newestTs > allowedTimeDiff) status = 0;

				res.send({status: status});
			});
	});
};

/**
 * Returns oldest timestamp
 */
exports.getOldestTs = function(req, res) {

	dbConf.createConnection(function(db) {
		var collection = db.collection(dbConf.collection);
		collection.find().limit(1).sort({timestamp: 1}).toArray(function(err, data) {
			res.send({timestamp: data[0].timestamp})
		});
	});
};


/**
 * Message from a client, that a specific tweet/list of tweets isn't available anymore.
 * - Check if tweet is in the database
 * - Check if tweet really isn't available anymore
 * - Delete entry from the database
 * Expected Query Parameters: tweetid | userid
 * @param req
 * @param res
 */
exports.tweetUnavailable = function(req, res) {
    if(req.query.tweetid === "" || req.query.userid === "") {
        res.send({error: "Invalid ID"});
        return;
    }

    res.send({
        message: "That you for information. We'll check the tweet."
    });

    var userId = Long.fromString(req.query.userid, 10),
        tweetId = Long.fromString(req.query.tweetid, 10);

    dbConf.createConnection(function(db) {
        console.log("check if tweet is available");
        var collection = db.collection(dbConf.collection);
        collection.find({
            tweet_id: tweetId,
            userid: userId
        }).toArray(function(err, data) {
            if(err) {
                res.send(500, "Error fetching data");
                return;
            }

            console.log("found " + data.length + " tweets in the database to check");

            // check if tweet still exists in database
            if(data.length === 0) {
//                res.send({message: "Tweet doesn't exist in the database."});
                return;
            }

            // Fetch tweet from twitter
            var url = "https://twitter.com/" + userId + "/status/" + tweetId
            parseTweetTextFromUrl(url, function(text) {

                // Tweet found and still exists --> do nothing
                if(text.length > 0) {
                    console.log("Tweet still exists so don't remove it")
//                    res.send({removed: false});
                    return;
                }

                // Tweet doesn't exist anymore --> delete
                else {
                    console.log("Didn't find tweet on twitter so remove it from the database");
                    collection.remove({tweet_id: tweetId, userid: userId}, function(err, numRemoved) {
                        console.log("removed: ", numRemoved)
//                        if(err) res.send(500, "Error removing tweet")
//                        else if(numRemoved >= 1) res.send({removed: true});
//                        else res.send({removed: false})
                    });
                }
            });
        });
    });
};

/**
 * Extracts text from a twitter url.
 * If the url just redirects to another url (on twitter), that url is used instead.
 * @param url
 * @param callback
 */
function parseTweetTextFromUrl(url, callback) {
    download(url, function(data) {
        var $ = cheerio.load(data);

        if($("body").text() === "You are being redirected.") {
            var url = $("a").attr("href");
            parseTweetTextFromUrl(url, callback);
            return;
        }

        var text = $(".js-tweet-text").first().text();
        console.log(text)
        callback(text);
    });
}

// Utility function that downloads a URL and invokes
// callback with the data.
function download(url, callback) {
    var request  = http;
    if(url.substr(0, 5).toLowerCase() === "https") request = https;

    request.get(url, function(res) {
        var data = "";
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on("end", function() {
            callback(data);
        });
    }).on("error", function() {
            callback(null);
        });
}