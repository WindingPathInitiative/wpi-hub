'use strict';

exports.up = ( knex, Promise ) => {
	return knex.schema.createTable( 'offices', ( table ) => {
		var officeTypes = [ 'Primary', 'Assistant', 'Other' ];

		table.increments().primary();
		table.string( 'name' ).notNullable();
		table.string( 'email' );
		table.enum( 'type', officeTypes ).notNullable();
		table.integer( 'parentOfficeID' ).index();
		table.integer( 'parentOrgID' ).notNullable().index();
		table.integer( 'userID' ).index();
	});
};

exports.down = ( knex, Promise ) => {
	return knex.schema.dropTable( 'offices' );
};
