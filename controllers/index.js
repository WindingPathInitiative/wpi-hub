'use strict';

const router   = require( 'express' ).Router();
const _        = require( 'lodash' );

// Authentication.
router.use( '/auth', require( './auth' ) );

// Users.
router.use( '/users', require( './user' ) );

// Org Units.
router.use( '/orgunits', require( './org-units' ) );

// Offices.
router.use( '/offices', require( './offices' ) );

// Dev endpoints.
if ( 'production' !== process.env.NODE_ENV ) {
	router.use( '/dev', require( './dev' ) );
}

router.get( '/',
	( req, res ) => {
		res.json({ message: 'Welcome to the user hub', version: res.app.get( 'version' ) });
	}
);

module.exports = router;
