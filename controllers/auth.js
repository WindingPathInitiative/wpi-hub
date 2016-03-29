'use strict';

/**
 * Authentication and login controller.
 */

const config         = GLOBAL.config.get( 'auth' );
const passport       = require( 'passport' );
const OAuth2Strategy = require( 'passport-oauth' ).OAuth2Strategy;
const request        = require( 'request' );
const stringify      = require( 'querystring' ).stringify;
const _              = require( 'lodash' );
const models         = require( '../models' );
const router         = require( 'express' ).Router();


/**
 * Gets initial redirect URL for app.
 */
router.get( '/:code',
	validateParam,
	( req, res ) => {
		let url = setupPassport( req );
		res.json({
			url: config.authorizationURL + '?' + stringify({
				response_type: 'code',
				redirect_uri:  url,
				client_id:     config.clientID
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

		models.Users.getByPortalId( req.user.remoteId )
		.then( user => {
			return user || new models.Users( req.user ).save();
		})
		.then( user => {
			return user.makeToken();
		})
		.then( token => {
			let clients = GLOBAL.config.get( 'clients' );
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
	let clients = GLOBAL.config.get( 'clients' );

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
	let conf = _.clone( config );
	conf.callbackURL += req.params.code + '/';

	passport.use( 'provider', new OAuth2Strategy(
		conf,
		( accessToken, refreshToken, profile, done ) => {
			request(
				config.userURL + '?' + stringify({ 'access_token': accessToken }),
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
