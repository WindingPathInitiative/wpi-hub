'use strict';

exports.up = ( knex, Promise ) => {
	return knex.schema.createTable( 'roles', ( table ) => {

		table.increments().primary();
		table.string( 'name' ).notNullable();

	});
};

exports.down = ( knex, Promise ) => {
	return knex.schema.dropTable( 'roles' );
};
