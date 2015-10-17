'use strict';

var express = require( 'express' ),
    router  = express.Router();

/* GET home page. */
router.get( '/', ( req, res, next ) => {
	console.log( req.user ); // Debug.
	if ( ! req.user ) {
		res.redirect( '/auth' );
		return;
	}

	res.render( 'index', { title: 'Express' } );
});

module.exports = router;
