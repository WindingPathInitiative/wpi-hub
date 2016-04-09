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
