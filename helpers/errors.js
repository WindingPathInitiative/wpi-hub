'use strict';

const inherits = require( 'util' ).inherits;

function UserError( message, dev ) {
	Error.call( this );
	this.message = message;
	if ( dev ) {
		this.dev = dev;
	}
};

inherits( UserError, Error );

module.exports = UserError;
