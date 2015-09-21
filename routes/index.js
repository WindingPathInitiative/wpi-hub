'use strict';

var express = require( 'express' ),
    router  = express.Router();

/* GET home page. */
router.get( '/', ( req, res, next ) => {
    console.log( req.user );
    if ( ! req.user ) {
        res.redirect( '/auth' );
    }

    res.render( 'index', { title: 'Express' } );
});

module.exports = router;
