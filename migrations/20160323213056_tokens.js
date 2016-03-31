
'use strict';

exports.up = ( knex, Promise ) => {
	return knex.schema.createTable( 'tokens', ( table ) => {
		table.uuid( 'token' ).notNullable().primary();
		table.integer( 'user' ).notNullable().index();
		table.timestamp( 'expires' ).notNullable().index();
	});
};

exports.down = ( knex, Promise ) => {
	return knex.schema.dropTable( 'tokens' );
};
