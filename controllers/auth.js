'use strict';

/**
 * Authentication and login controller.
 */

const config     = require( '../config' );
const authConfig = config.get( 'auth' );
const passport   = require( 'passport' );
const stringify  = require( 'querystring' ).stringify;
const router     = require( 'express' ).Router();
const token      = require( '../middlewares/token' );


/**
 * Gets initial redirect URL for app.
 */
router.get( '/signin/:code',
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

		let User = require( '../models/user' );

		User.getByPortalId( req.user.remoteId )
		.then( user => {
			return user || new User( req.user ).save();
		})
		.then( user => {
			return user.makeToken();
		})
		.then( token => {
			let clients = config.get( 'clients' );
			let url     = require( 'url' );
			let urlObj  = url.parse( clients[ req.params.code ], true );

			res.cookie( 'token', token.id, { domain: urlObj.hostname } );
			urlObj.query.token = token.id;
			urlObj.search = null;
			res.redirect( url.format( urlObj ) );
		});
	}
);

router.get( '/signout',
	token.validate(),
	( req, res ) => {
		req.token.destroy()
		.then( model => {
			res.clearCookie( 'token' );
			res.json({ success: 1 });
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
