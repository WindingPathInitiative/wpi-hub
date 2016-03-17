'use strict';

const router   = require( 'express' ).Router();
const passport = require( 'passport' );

// Authenticate user.
router.get( '/', passport.authenticate( 'provider' ) );

// Verifies user.
router.get( '/verify',
	passport.authenticate( 'provider', {
		failureRedirect: 'http://portal.mindseyesociety.org'
	}),
	( req, res ) => {
		if ( req.user ) {
			req.session.name   = req.user.firstName;
			req.session.userId = req.user.membershipNumber;
		}

		// TODO: Figure out a way to redirect to module.
		res.redirect( '/' );
	}
);

module.exports = router;
