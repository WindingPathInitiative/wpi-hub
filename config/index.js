'use strict';

let config = {};

const glob = require( 'glob' ).sync;
const _    = require( 'lodash' );

// Get the files.
let files = glob( __dirname + '/**/*.json', { ignore: '**/*.default.json' } );

// Generate configs.
let objs = _.object(
	files.map( ( file ) => {
		return _.at( file.match( /(\w+)\.json$/i ), 1 );
	}),
	files.map( require )
);

config = _.merge( config, objs );

module.exports = config;

module.exports.get = ( index ) => config[ index ];
