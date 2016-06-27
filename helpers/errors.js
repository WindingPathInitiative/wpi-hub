'use strict';

const inherits = require( 'util' ).inherits;

function UserError( message, status, dev ) {
	Error.call( this );
	this.message = message;
	if ( status instanceof Error ) {
		dev = status;
	} else {
		this.status = status;
	}
	if ( dev ) {
		this.dev = dev;
	}
};

inherits( UserError, Error );

module.exports = UserError;

/**
 * Helper for catching and displaying errors.
 * @param {mixed}    err     Either a regular error or a UserError.
 * @param {Function} next    Express middleware callback.
 * @param {String}   message Optional error message.
 * @return {void}
 */
module.exports.catch = ( err, next, message ) => {
	if ( err instanceof UserError ) {
		next( err );
	} else {
		let msg = err.message || message || 'Authentication failed';
		next( new UserError( msg, 403, err ) );
	}
};
