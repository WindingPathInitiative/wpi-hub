'use strict';

/**
 * Authentication and login module.
 *
 * This makes sure the user is correctly logged in,
 * and redirects them if they are not.
 */

const config         = GLOBAL.config.get( 'auth' );

const passport       = require( 'passport' );
const OAuth2Strategy = require( 'passport-oauth' ).OAuth2Strategy;
const request        = require( 'request' );
const stringify      = require( 'querystring' ).stringify;

module.exports = ( app ) => {

	app.use( passport.initialize() );
	app.use( passport.session() );

	let callback = ( accessToken, refreshToken, profile, done ) => {
		request(
			config.userURL + '?' + stringify({ 'access_token': accessToken }),
			( err, res, body ) => {
				if ( err ) {
					done( err, false );
				}
				done( null, JSON.parse( body ) );
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
