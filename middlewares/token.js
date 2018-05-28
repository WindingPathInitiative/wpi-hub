'use strict';
var jwt = require('jsonwebtoken');
var jwkToPem = require('jwk-to-pem');
const config     = require( '../config' );
const jwks = config.get( 'jwks' );
const auth = config.get( 'auth' );
var pem;
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
	}else if ( 'None' === req.user.get( 'membershipType') || 'Pending' === req.user.get( 'membershipType' ) ) {
		next( new UserError( 'User is not a member', 403 ) );
	}else if ( 'Suspended' === req.user.get( 'membershipType' ) ) {
		next( new UserError( 'User is suspended', 403 ) );
	}else if ( 'Expelled' === req.user.get( 'membershipType' ) ) {
		next( new UserError( 'User is expelled', 403 ) );
	}else if ( 'Uninvited' === req.user.get( 'membershipType' ) ) {
		next( new UserError( 'User has been declined membership', 403 ) );
	}else if ( req.user.get( 'membershipExpiration' ).getTime() < Date.now() ) {
		next( new UserError( 'User is expired', 403 ) );
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
	
	// Development mode bypass.
	if ( 'development' === req.app.get( 'env' ) && 'DEV' === req.query.token ) {
		return fakeToken( req, 1, fetch, next );
	}

	// Throw error if a token is required.
	if ( ! ( 'authorization' in req.headers ) ) {
		if ( required ) {
			next( new UserError( 'Authorization Token not provided', 403 ) );
		} else {
			next();
		}
		return;
	}
	
	var token_info = verifyToken(req.headers['authorization']);
	if(token_info == false){
		next( new UserError( 'Invalid jwt', 403 ) );
		return;
	}
	
	req.query.token = token_info.event_id;
	
	return fakeToken( req, token_info , fetch, next );
}

function verifyToken(token){
	if(!pem){
		var keys = jwks['keys'];
		for(var i = 0; i < keys.length; i++) {
			if(keys[i].kid != auth.token_kid) continue;
			//Convert each key to PEM
			var key_id = keys[i].kid;
			var modulus = keys[i].n;
			var exponent = keys[i].e;
			var key_type = keys[i].kty;
			var jwk = { kty: key_type, n: modulus, e: exponent};
			var pem = jwkToPem(jwk);
		}
		if(!pem){
			console.log("Could not get jwt pem!");
			return false;
		}
	}
	try {
		var decoded = jwt.verify(token, pem, {issuer: auth.token_iss, algorithms: auth.token_algorithms, maxAge: "1d"});
	} catch(err) {
		console.log("token error",err);
		return false;// err
	}
	console.log('decoded jwt',decoded);
	return decoded;
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
	if(isNaN(id) && id.sub){
		return User.getByPortalId( id.sub ) //See if we have a User by this Cognito Identity
			.then( user => {
				console.log('get portal by ID in fake token');
				//console.log(user);
				if(user){
					if(req.query.refresh){ //We're updating cognito details and sending a new token with them
						console.log('updating user from token');
						return user.save(id);
					}
					else return user;
				}
				else if (id.email && id.email_verified){
					//See if we have an existing user with the same email, so we can just update them.
					return new User({'email': id.email}).fetch().then( user => {
						if(user){
							console.log('Found existing email user, updating');
							return user.save(id);
						}else return new User( id ).save(); //Did not find user, just create new one
					});
				}
				else return new User( id ).save();
			}).then( user => {
				console.log('setting user in request and token');
				console.log(user);
				req.user = user;
				req.tokenInfo= id;
				req.token = {
					get: () => {console.log('fetching user'); return user;},
					destroy: () => null,
					id: req.query.token
				};
				next();
			});
	}else{
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
}

// Expose for unit tests.
module.exports.fakeToken = fakeToken;
