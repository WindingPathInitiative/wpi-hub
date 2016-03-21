'use strict';

const passport = require( 'passport' );
const router   = require( 'express' ).Router();
const _        = require( 'lodash' );

// Authenticate user.
router.get( '/', passport.authenticate( 'provider', { session: false } ) );

router.get( '/verify',
	passport.authenticate( 'provider', {
		failureRedirect: 'http://portal.mindseyesociety.org'
	}),
	( req, res ) => {
		res.json( req.user );
	}
);

router.get( '/test', ( req, res, next ) => {
	req.session.token = Date.now();
	res.json({
		id: req.session.id,
		token: req.session.token
	});
});

var saveUser = ( req, res ) => {

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
	})

	// Can't find the user, so add it.
	.catch( models.Users.NotFoundError, ( err ) => {
		models.Users
			.forge( user )
			.save()
			.then( ( model ) => {
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
};

module.exports = router;
