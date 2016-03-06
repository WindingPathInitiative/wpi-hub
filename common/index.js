'use strict';

module.exports.init = ( app ) => {

	// Sessions.
	require( './sessions' )( app );

	// Navigation.
	app.use( require( './nav' ) );

	// Database.
	let db = require( './db' );
	app.set( 'bookshelf', db.Bookshelf );
};
