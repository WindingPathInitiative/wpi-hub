'use strict';

var express = require( 'express' ),
    models  = require( '../models' ),
    router  = express.Router();

/* GET home page. */
var display = ( user, res ) => {
	res.render( 'index', { title: 'Express', user: user } );
};

router.get( '/', ( req, res, next ) => {
	if ( ! req.user || ! req.user.membershipNumber ) {
		res.redirect( '/auth' );
		return;
	}

	models.Users
		// Load the user.
		.forge({ membershipNumber: req.user.membershipNumber })
		.fetch({ withRelated: 'orgUnit', require: true })
		.then( ( model ) => {
			display( model, res );
		})

		// Can't find the user, so add it.
		.catch( models.Users.NotFoundError, ( err ) => {
			models.Users
				.forge( req.user )
				.save()
				.then( ( model ) => {
					display( model, res );
				})
				.catch( ( err ) => {
					console.error( err );
					res.status( 500 ).send( 'Could not save user.' );
				});
		})

		// Throw a generic error.
		.catch( ( err ) => {
			console.error( err );
			res.status( 404 ).send( 'Error retrieving user.' );
		});
});

module.exports = router;
