'use strict';

/**
 * Module loading system.
 *
 * Directories in here follow a specific format so they are loaded in the main
 * application.
 */

const glob = require( 'glob' ).sync;
const _    = require( 'lodash' );

// Creates main module object.
let modules = glob( __dirname + '/*/index.js' );
modules = _.object(
	modules.map( file => _.at( file.match( /(\w+)\/index\.js$/i ), 1 ) ),
	modules.map( require )
);

// Helper function for loading specific methods.
const invoke = ( type, app ) => {
	_( modules )
	.filter( type )
	.invoke( type, app )
	.value();
};

// Exports.
GLOBAL.modules = module.exports = {
	init:   app => invoke( 'init', app ),
	routes: app => invoke( 'routes', app ),
	prefix: _.pluck( modules, 'prefix' ),
	get:    name => modules[ name ]
};
