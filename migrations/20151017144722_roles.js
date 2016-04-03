'use strict';

exports.up = ( knex, Promise ) => {
	return knex.schema.createTable( 'roles', ( table ) => {
		table.increments().primary();
		table.string( 'name' ).notNullable().unique();
		table.string( 'slug' ).notNullable().unique();
	});
};

exports.down = ( knex, Promise ) => {
	return knex.schema.dropTable( 'roles' );
};
