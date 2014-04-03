var CronJob = require('cron').CronJob;
var moment = require("moment");
var cache = require("../tworpus/cache");

/**
 * Periodically updates todays and yesterdays tweet counts
 */
exports.start = function() {
    new CronJob('0 */10 * * * *', function(){
        var today = moment();
        console.log("update today", today.valueOf());
        cache.updateCacheTableForDay(today.valueOf());
    }, null, true, "Europe/Berlin");

    new CronJob('0 */20 * * * *', function(){
        var yesterday = moment().day("-1");
        console.log("update yesterday", yesterday.valueOf());
        cache.updateCacheTableForDay(yesterday.valueOf());
    }, null, true, "Europe/Berlin");
};