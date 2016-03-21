'use strict';

module.exports.init = ( app ) => {

	// Database.
	let db = require( './db' );
	app.set( 'bookshelf', db.Bookshelf );
	app.set( 'db', db.Knex );
};
