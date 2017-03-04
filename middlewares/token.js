'use strict';

const Token     = require( '../models/token' );
const UserError = require( '../helpers/errors' );
const User      = require( '../models/user' );


/**
 * Refreshes a token, if it exists.
 * @return {void}
 */
exports.normalize = ( req, res, next ) => {

	// Normalize the query with cookie data.
	if ( 'development' === req.app.get( 'env' ) && 'token' in req.cookies ) {
		req.query.token = req.cookies.token;
	} else if ( 'authorization' in req.headers ) {
		req.query.token = req.headers.authorization.toLowerCase().replace( 'bearer ', '' );
	}
	next();

	Token.removeExpired().return();
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
 * Checks whether user is expired/suspended or not.
 * @param {object}   req  Express request.
 * @param {object}   res  Express response.
 * @param {Function} next Callback.
 * @return {void}
 */
exports.expired = ( req, res, next ) => {
	if ( ! req.user ) {
		next( new UserError( 'User not loaded', 500 ) );
	} else if ( req.user.get( 'membershipExpiration' ).getTime() < Date.now() ) {
		next( new UserError( 'User is expired', 403 ) );
	} else if ( 'Suspended' === req.user.get( 'membershipType' ) ) {
		next( new UserError( 'User is suspended', 403 ) );
	} else {
		next();
	}
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
	if ( ! ( 'token' in req.query ) ) {
		if ( required ) {
			next( new UserError( 'Token not provided', 403 ) );
		} else {
			next();
		}
		return;
	}

	// Development mode bypass.
	if ( 'development' === req.app.get( 'env' ) && 'DEV' === req.query.token ) {
		return fakeToken( req, 1, fetch, next );
	}

	if ( 'auth-user' in req.headers ) {
		return fakeToken( req, req.headers['auth-user'], fetch, next );
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

		if ( token ) {
			token.refresh();
		}
	})
	.catch( err => {
		next( new UserError( 'Invalid token', 403, err ) );
	});
}

/**
 * Creates a fake token.
 * @param {Object}   req   Express request object.
 * @param {Number}   id    ID of user.
 * @param {Boolean}  fetch True to get user data.
 * @param {Function} next  Callback.
 * @return {mixed}
 */
function fakeToken( req, id, fetch, next ) {
	req.token = {
		get: () => id,
		destroy: () => null,
		id: req.query.token
	};
	if ( fetch ) {
		return new User({ id })
		.fetch({ require: true })
		.then( user => {
			req.user = user;
			next();
		})
		.catch( err => {
			next( new UserError( 'Invalid token', 403, err ) );
		});
	}
	next();
}

// Expose for unit tests.
module.exports.fakeToken = fakeToken;
