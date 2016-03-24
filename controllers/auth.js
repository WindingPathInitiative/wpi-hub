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


/**
 * Validates whether a param is correctly passed.
 */
exports.validateParam = ( req, res, next ) => {
	let clients = GLOBAL.config.get( 'clients' );

	if ( ! req.params.hasOwnProperty( 'code' ) || 'verify' === req.params.code ) {
		next( new Error( 'No code provided' ) );
	} else if ( ! clients.hasOwnProperty( req.params.code ) ) {
		next( new Error( 'Invalid code provided' ) );
	}
	next();
};


/**
 * Returns login URL.
 */
exports.getLogin = ( req, res ) => {
	let url = setupPassport( req );
	res.json({
		url: config.authorizationURL + '?' + stringify({
			response_type: 'code',
			redirect_uri:  url,
			client_id:     config.clientID
		})
	});
};


/**
 * Redirects the user back to the application with token.
 */
exports.getValidate = ( req, res ) => {
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
};


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
