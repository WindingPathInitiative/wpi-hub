'use strict';

exports.up = ( knex, Promise ) => {
	return knex.schema.createTable( 'offices', ( table ) => {
		var officeTypes = [ 'Primary', 'Assistant' ];

		table.increments().primary();
		table.string( 'name' ).notNullable();
		table.string( 'email' );
		table.enum( 'type', officeTypes ).notNullable();
		table.integer( 'parentOfficeID' ).index();
		table.string( 'parentOfficePath' ).notNullable().index();
		table.integer( 'parentOrgID' ).notNullable().index();
		table.integer( 'userID' ).index();
		table.json( 'roles' );
	});
};

exports.down = ( knex, Promise ) => {
	return knex.schema.dropTable( 'offices' );
};
