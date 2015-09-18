'use strict';

var express = require('express'),
    router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    console.log( req.user );

    res.render('index', { title: 'Express' });
});

module.exports = router;
