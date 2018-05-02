'use strict';

const _    = require( 'lodash' );

// Get the files.
let files = [ 'audit', 'auth', 'clients', 'db', 'jwks', 'organizations' ];

// Generate configs.
let config = _.zipObject(
	files,
	files.map( file => {
		return './' + file + '.json';
	}).map( require )
);

module.exports = config;

module.exports.get = ( index ) => config[ index ];
