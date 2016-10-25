'use strict';

const UserError = require( '../helpers/errors' );

/**
 * Checks if this request is on the internal network.
 * @return {void}
 */
exports.internal = ( req, res, next ) => {
	let port = req.app.get( 'internalPort' );
	if ( ! port ) {
		next( new UserError( 'Internal error', 500 ) );
	}
	if ( Number.parseInt( port ) !== req.socket.localPort ) {
		next( new UserError( 'Request over insecure port', 403 ) );
	}
	next();
};
