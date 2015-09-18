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
    callback;

callback = ( accessToken, refreshToken, profile, done ) => {
    console.log( 'HERE', accessToken, refreshToken, profile );
    done( null, false );
};

module.exports = ( req, res ) => {
    console.log( 'authenticating...' );
    passport.use( 'provider', new OAuth2Strategy( config, callback ) );
};
