'use strict';

const UserError = require( '../helpers/errors' );

/**
 * Checks if this request is on the internal network.
 * @return {void}
 */
exports.internal = ( req, res, next ) => {
	let err = exports.isNotInternal( req );
	if ( err ) {
		return next( err );
	}
	next();
};


/**
 * Checks if a port is internal, returning an error if not.
 * @param {Object} req Request object.
 * @return {void|UserError}
 */
exports.isNotInternal = req => {
	let port = req.app.get( 'internalPort' );
	if ( ! port ) {
		return new UserError( 'Internal error', 500 );
	}
	if ( Number.parseInt( port ) !== req.socket.localPort ) {
		return new UserError( 'Request over insecure port', 403 );
	}
};
