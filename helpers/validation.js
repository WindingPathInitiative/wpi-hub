'use strict';

const validate = require( 'validate.js' );
const Promise  = require( 'bluebird' );
const moment   = require( 'moment' );
const _        = require( 'lodash' );

validate.Promise = Promise;

validate.validators.isString = val => {
	return new Promise( ( res, rej ) => {
		if ( undefined === val || _.isString( val ) ) {
			res();
		} else {
			res( 'is not a string' );
		}
	});
};

let formatter = opts => opts.dateOnly ? 'YYYY-MM-DD' : 'YYYY-MM-DD hh:mm:ss';

validate.extend( validate.validators.datetime, {
	parse: ( value, options ) => +moment.utc( value, formatter( options ) ),
	format: ( value, options ) => moment.utc( value ).format( formatter( options ) )
});

module.exports = validate;

module.exports.format = function( errs ) {
	if ( 'string' === typeof errs ) {
		return errs;
	}
	return _.map( errs, err => err.join( ', ' ) ).join( ', ' );
};
