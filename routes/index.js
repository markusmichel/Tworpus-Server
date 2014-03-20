/*
 * GET home page.
 */

/*
var MongoClient = require('mongodb').MongoClient
	, dbConf = require("../conf/db_conf").DbConf;
*/
exports.index = function (req, res) {

	res.render('index.html');

	/*
	dbConf.createConnection(function (db) {
		var collection = db.collection(dbConf.collection);
		var length = collection.find({}).sort(['timestamp']).(function (err, tweets) {
			res.render('index.html', { length: count });
		});
	});
	*/
};