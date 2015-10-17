'use strict';

/**
 * Authentication and login module.
 *
 * This makes sure the user is correctly logged in,
 * and redirects them if they are not.
 */

var config         = require( './config/auth.json' ),
    passport       = require( 'passport' ),
    OAuth2Strategy = require( 'passport-oauth' ).OAuth2Strategy,
    request        = require( 'request' ),
    stringify      = require( 'querystring' ).stringify;

module.exports = ( app ) => {

	app.use( passport.initialize() );
	app.use( passport.session() );

	var callback = ( accessToken, refreshToken, profile, done ) => {
		request(
			config.userURL + '?' + stringify({ 'access_token': accessToken }),
			( err, res, body ) => {
				if ( err ) {
					done( err, false );
				}
				var user = JSON.parse( body );
				done( null, user );
			}
		);
	};
	passport.use( 'provider', new OAuth2Strategy( config, callback ) );

	passport.serializeUser( ( user, done ) => {
		done( null, user );
	});

	passport.deserializeUser( ( user, done ) => {
		done( null, user );
	});
};
