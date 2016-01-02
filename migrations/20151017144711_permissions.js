'use strict';

exports.up = ( knex, Promise ) => {
	return knex.schema.createTable( 'permissions', ( table ) => {

		table.increments().primary();
		table.integer( 'officeID' ).index();
		table.integer( 'roleID' ).index();

	});
};

exports.down = ( knex, Promise ) => {
	return knex.schema.dropTable( 'permissions' );
};
