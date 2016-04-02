'use strict';

const Token = require( '../models' ).Tokens;


/**
 * Refreshes a token, if it exists.
 * @return {void}
 */
exports.renew = ( req, res, next ) => {

	// Normalize the query with cookie data.
	if ( 'token' in req.cookies ) {
		req.query.token = req.cookies.token;
	}

	if ( 'token' in req.query ) {
		Token.refresh( req.query.token );
	}
	next();
};


/**
 * Checks for an existing token.
 * @param {boolean} True if token is required.
 * @return {Function}
 */
exports.validate = required => {
	return ( req, res, next ) => {
		query( req, next, required );
	};
};


/**
 * Checks for token data, and pulls user if it exists.
 * @param {boolean} True if token is required.
 * @return {Function}
 */
exports.parse = required => {
	return ( req, res, next ) => {
		query( req, next, required, true );
	};
};


/**
 * Queries the token table.
 * @param  {Object}   req      The request object.
 * @param  {Function} next     Next function call.
 * @param  {boolean}  required Optional. True if token is required.
 * @param  {boolean}  fetch    Optional. True if should fetch user data.
 * @return {void}
 */
function query( req, next, required, fetch ) {

	// Sets default for requiring token.
	if ( undefined === required ) {
		required = true;
	}

	// Sets default for fetching user.
	if ( undefined === fetch ) {
		fetch = false;
	}

	// Throw error if a token is required.
	if ( required && ! ( 'token' in req.query ) ) {
		let err = new Error( 'Token not provided' );
		err.status = 401;
		next( err );
		return;
	}

	let fetchParams = { require: required };
	if ( fetch ) {
		fetchParams.withRelated = 'user';
	}

	new Token({ token: req.query.token })
	.notExpired()
	.fetch( fetchParams )
	.then( token => {
		req.token = token;
		if ( fetch && token ) {
			req.user = token.related( 'user' );
		}
		next();
	})
	.catch( () => {
		let err = new Error( 'Invalid token' );
		err.status = 401;
		next( err );
	});

}
