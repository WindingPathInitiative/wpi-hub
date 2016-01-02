'use strict';

exports.up = ( knex, Promise ) => {
	return knex.schema.createTable( 'offices', ( table ) => {
		var officeTypes = [ 'Primary', 'Assistant', 'Other' ];

		table.increments().primary();
		table.string( 'name' ).notNull();
		table.string( 'email' ).nullable();
		table.enum( 'type', officeTypes ).notNull();
		table.integer( 'parentOfficeID' ).index();
		table.integer( 'parentOrgID' ).index();
		table.integer( 'userID' ).index();
	});
};

exports.down = ( knex, Promise ) => {
	return knex.schema.dropTable( 'offices' );
};
