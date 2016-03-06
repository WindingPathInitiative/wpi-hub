'use strict';

var express = require( 'express' ),
    router  = express.Router(),
    _       = require( 'lodash' ),
    display;

/* GET home page. */
display = ( user, res ) => {

	var domain = user.related( 'orgUnit' ),
	    data   = {};

	if ( domain ) {
		data.code = domain.get( 'code' );
		data.name = domain.get( 'name' );
		data.link = '/location/' + domain.get( 'code' );
		data.site = domain.get( 'site' );
	}

	res.render( 'index', {
		title:  'Membership Information',
		name:   user.get( 'firstName' ) + ' ' + user.get( 'lastName' ),
		domain: data
	});
};

router.get( '/', ( req, res, next ) => {
	if ( ! req.user || ! req.user.membershipNumber ) {
		res.redirect( '/auth' );
		return;
	}

	// Normalizes user for DB.
	var user = _.chain( req.user )
		.pick( req.user, [
			'firstName',
			'lastName',
			'nickname',
			'emailAddress',
			'membershipType',
			'membershipNumber',
			'membershipExpiration'
		])
		.mapKeys( ( value, key ) => {
			return 'emailAddress' === key ? 'email' : key;
		})
		.value();

	const models = require( '../models' );

	models.Users

		// Load the user.
		.forge({
			membershipNumber: user.membershipNumber
		})
		.fetch({ withRelated: 'orgUnit', require: true })
		.then( ( model ) => {
			display( model, res );
		})

		// Can't find the user, so add it.
		.catch( models.Users.NotFoundError, ( err ) => {
			models.Users
				.forge( user )
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
