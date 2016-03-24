
'use strict';

exports.up = ( knex, Promise ) => {
	return knex.schema.createTable( 'tokens', ( table ) => {
		table.uuid( 'token' ).notNull().primary();
		table.integer( 'user' ).notNull().index();
		table.timestamp( 'expires' ).notNull().index();
	});
};

exports.down = ( knex, Promise ) => {
	return knex.schema.dropTable( 'tokens' );
};
