'use strict';

const Token = require( '../models' ).Tokens;


/**
 * Normalizes the request object.
 * @param  {Object} req The request object.
 * @return {void}
 */
function normalize( req ) {
	if ( 'token' in req.cookies ) {
		req.query.token = req.cookies.token;
	}
}


/**
 * Validates the token exists.
 * @param  {object}   req  The request object.
 * @param  {Function} next Sends route to next middleware.
 * @return {boolean}       Returns true on invalid data.
 */
function validate( req, next ) {

	// Normalize first.
	normalize( req );

	// Skip to next middleware if there's no validation.
	if ( ! ( 'token' in req.query ) ) {
		if ( req.skipValidation ) {
			next();
			return false;
		} else {
			next( new Error( 'Token not provided' ) );
			return false;
		}
	}
	return true;
}


/**
 * Checks for an existing token.
 * @return {void}
 */
exports.validate = ( req, res, next ) => {
	if ( ! validate( req, next ) ) {
		return;
	}

	new Token({ token: req.query.token })
	.where( 'expires', '>', 'NOW' )
	.fetch({ require: true })
	.then( token => {
		req.token = token;
		next();
	})
	.catch( err => {
		next( new Error( 'Invalid token' ) );
	});
};


/**
 * Checks for token data, and pulls user if it exists.
 * @return {void}
 */
exports.parse = ( req, res, next ) => {
	if ( ! validate( req, next ) ) {
		return;
	}

	new Token({ token: req.query.token })
	.where( 'expires', '>', 'NOW' )
	.fetch({ withRelated: 'user', require: true })
	.then( token => {
		req.token = token;
		req.user  = token.related( 'user' );
		next();
	})
	.catch( err => {
		next( new Error( 'Invalid token' ) );
	});
};


/**
 * Bypasses next step if token not present.
 * Used for making token optional.
 * @return {void}
 */
exports.optional = ( req, res, next ) => {
	normalize( req );
	if ( ! ( 'token' in req.query ) ) {
		req.skipValidation = true;
	}
	next();
};
