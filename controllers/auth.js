'use strict';

/**
 * Authentication and login controller.
 */

const config     = require( '../config' );
const authConfig = config.get( 'auth' );
const passport   = require( 'passport' );
const stringify  = require( 'querystring' ).stringify;
const router     = require( 'express' ).Router();


/**
 * Gets initial redirect URL for app.
 */
router.get( '/:code',
	validateParam,
	( req, res ) => {
		let url = setupPassport( req );
		res.json({
			url: authConfig.authorizationURL + '?' + stringify({
				response_type: 'code',
				redirect_uri:  url,
				client_id:     authConfig.clientID
			})
		});
	}
);


/**
 * Validates user login and returns token to app.
 */
router.get( '/verify/:code',
	validateParam,
	passport.authenticate( 'provider', {
		failureRedirect: 'http://portal.mindseyesociety.org',
		session: false
	}),
	( req, res ) => {
		setupPassport( req );

		let Users = require( '../models' ).Users;

		Users.getByPortalId( req.user.remoteId )
		.then( user => {
			return user || new Users( req.user ).save();
		})
		.then( user => {
			return user.makeToken();
		})
		.then( token => {
			let clients = config.get( 'clients' );
			res.redirect(
				clients[ req.params.code ] + '?' + stringify({
					token: token.id
				})
			);
		});
	}
);

module.exports = router;


/**
 * Validates whether a param is correctly passed.
 */
function validateParam( req, res, next ) {
	let clients = config.get( 'clients' );

	if ( ! req.params.hasOwnProperty( 'code' ) || 'verify' === req.params.code ) {
		next( new Error( 'No code provided' ) );
	} else if ( ! clients.hasOwnProperty( req.params.code ) ) {
		next( new Error( 'Invalid code provided' ) );
	}
	next();
}


/**
 * Sets up Passport.
 * @param  {req} Request object.
 * @return {string} The callback URL.
 */
function setupPassport( req ) {
	let _    = require( 'lodash' );
	let conf = _.clone( authConfig );
	conf.callbackURL += req.params.code + '/';

	let OAuth2Strategy = require( 'passport-oauth' ).OAuth2Strategy;

	passport.use( 'provider', new OAuth2Strategy(
		conf,
		( accessToken, refreshToken, profile, done ) => {
			let request = require( 'request' );
			request(
				conf.userURL + '?' + stringify({ 'access_token': accessToken }),
				( err, res, body ) => {
					if ( err ) {
						done( err );
					}
					done( null, JSON.parse( body ) );
				}
			);
		}
	) );

	return conf.callbackURL;
}
