'use strict';

const express = require( 'express' );
const router  = express.Router();
const _       = require( 'lodash' );
const models  = require( '../models' );

// User data page.
let display = ( user, res ) => {

	let domain = user.related( 'orgUnit' );
	let data   = {};

	if ( domain ) {
		data.code = domain.get( 'code' );
		data.name = domain.get( 'name' );
		data.link = '/location/' + domain.get( 'code' );
		data.site = domain.get( 'site' );
	}

	res.render( 'me', {
		title:    'Membership Information',
		fullname: user.get( 'firstName' ) + ' ' + user.get( 'lastName' ),
		domain:   data
	});
};

router.get( '/', ( req, res, next ) => {
	if ( ! req.user || ! req.user.membershipNumber ) {
		res.redirect( '/auth' );
		return;
	}

	// Normalizes user for DB.
	let user = _.chain( req.user )
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
