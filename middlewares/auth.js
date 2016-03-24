'use strict';

/**
 * Authentication and login module.
 *
 * This makes sure the user is correctly logged in,
 * and redirects them if they are not.
 */

const passport       = require( 'passport' );

module.exports = ( app ) => {
	app.use( passport.initialize() );
};
