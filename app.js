/**
Bootlint HTTP server API
Run it via: npm run start
This is pretty niche. Most users should probably use the CLI or bookmarklet instead.
*/
var bootlint = require('./src/bootlint');
var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');


var HTML_MIME_TYPES = [
    'text/html',
    'application/xhtml+xml'
];

function disabledIdsFor(req) {
    var rawIds = req.query.disable;
    if (!rawIds) {
        return [];
    }
    return rawIds.split(',');
}

function lintsFor(html, disabledIds) {
    var lints = [];
    var reporter = function (lint) {
        lints.push(lint);
    };
    bootlint.lintHtml(html, reporter, disabledIds);
    return lints;
}


var routes = express.Router();

routes.get('/', function (req, res) {
    res.status(200).json({status: 200, message: 'Bootlint is online!'});
});

routes.post('/', function (req, res) {
    var isHtml = HTML_MIME_TYPES.some(function (type) {
        return req.is(type);
    })
    if (!isHtml) {
        res.status(415).json({status: 415, message: 'Unsupported Media Type', details: 'Content-Type was not an HTML MIME type'});
        return;
    }

    res.format({
        'application/json': function () {
            var disabledIds = disabledIdsFor(req);
            var html = req.body;
            console.log("HTML: ", html);
            var lints = lintsFor(html, disabledIds);
            lints.forEach(function (lint) {
                lint.elements = undefined;
            });
            res.status(200).json(lints);
        },
        'default': function () {
            res.status(406).json({status: 406, message: 'Not Acceptable', details: '"Accept" header must allow MIME type application/json'});
        }
    });
});


var app = express();

app.use(logger('dev'));
HTML_MIME_TYPES.forEach(function (type) {
    app.use(bodyParser.text({type: type}));
});

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        err.status = (err.status || 500)
        res.status(err.status).json({status: err.status, message: err.message, stack: err.stack});
    });
}


module.exports = app;