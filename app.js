
/**
 * Module dependencies.
 */

var express = require('express');
var nunjucks = require('nunjucks');

var routes = require('./routes'),
    user = require('./routes/user'),
    tworpusApi = require('./routes/tworpus_rest_api');

var http = require('http'),
    app = express(),
    server = http.createServer(app),
    io = require("socket.io").listen(server),
    path = require('path'),
    twitter = require('ntwitter'),
    crawler = require('./crawler/crawler');

var dbConf = require('./conf/db_conf').DbConf;
var twit = require('./conf/twitter_conf').TwitterConf;

//crawler.crawl(db, twit);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// Nunjucks template engine
nunjucks.configure('views', {
    autoescape: true,
    express: app
});

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.get("/test", user.list);

// Route definitions
app.get('/', routes.index);
app.get('/users', user.list);

app.get('/api/v1/tweets/find',  tworpusApi.getTweets);
app.get('/api/v1/tweets/count/:language', tworpusApi.getTweetsCount);
app.get('/api/v1/tweets/crawlstatus', tworpusApi.getCrawlStatus);
app.get('/api/v1/tweets/oldesttimestamp', tworpusApi.getOldestTs);
app.get('/api/v1/unavailable',  tworpusApi.tweetUnavailable);

server.listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});

var clients = [];
io.sockets.on('connection', function (socket) {

    socket.on('connect', function(socketid) {
        console.log("_______CONNECTED__________", socketid)
//        socket.id = socketid;
        socket.customid = socketid;
        clients["" + socketid] = socket;
    });

    socket.on('disconnect', function() {
        console.log("disconnect " + socket.id)
        delete clients[socket.customid];
    });
});


app.post('/api/v1/sockets/emit/progress/:socketid', function(req, res) {
    var socketid = req.params.socketid,
        progress   = req.body.status;
    var socket = clients[req.params.socketid];

    var status = req.body.status;
    console.log("################################")
    console.log(status.steps)

    if(socket) {
        socket.emit("corpuscreation_progress", status);
    }

    res.send("foo");
});



require('./conf/db_conf').DbConf.createConnection();
