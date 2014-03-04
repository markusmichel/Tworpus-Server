var assert = require('assert');
var savedTweets = 0;
var totalTweets = 0;
var s = 0;

exports.crawl = function(db, twitter) {
    db.open(function(err, db) {
        if(err) throw err;

        var collection = db.collection('Node_Tweet');
        var tweets = [];

        twitter.stream('statuses/sample', function(stream) {
            stream.on('data', function (data) {
                assert.notEqual(data, null);

                var tweet = {
                    id: data.id_str,
                    text: data.text,
                    chars: data.text.length,
                    hashtags: data.entities.hashtags,
                    geo: data.geo,
                    coordinates: data.coordinates,
                    place: data.place,
                    lang: data.lang,
                    foo: "bar"
                }

                tweets.push(tweet);
                totalTweets++;

                if(tweets.length >= 100) {
                    collection.insert(tweets, function() {
                        savedTweets += tweets.length;
                        tweets = [];
                    });
                }
            });
        });
    });


    setInterval(function() {
        console.log(savedTweets + " / " + totalTweets + " tweets after " + (++s) + " seconds");
    }, 1000);
};