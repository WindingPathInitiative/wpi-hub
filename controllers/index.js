'use strict';

const router   = require( 'express' ).Router();
const _        = require( 'lodash' );

const version  = require( '../package.json' ).version;
const prefix   = '/v' + version.split( '.' ).shift();

// Authentication.
router.use( prefix + '/auth', require( './auth' ) );

// Users.
router.use( prefix + '/users', require( './user' ) );

// Org Units.
router.use( prefix + '/orgunits', require( './org-units' ) );

// Offices.
router.use( prefix + '/offices', require( './offices' ) );

// Dev endpoints.
if ( 'production' !== process.env.NODE_ENV ) {
	router.use( '/dev', require( './dev' ) );
}

router.get( '/',
	( req, res ) => {
		res.json({ message: 'Welcome to the user hub', version: version });
	}
);

module.exports = router;
