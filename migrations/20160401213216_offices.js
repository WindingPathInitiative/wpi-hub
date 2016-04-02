'use strict';

exports.up = ( knex, Promise ) => {
	return knex.schema.table( 'offices', table => {
		table.json( 'roles' );
	});
};

exports.down = ( knex, Promise ) => {
	return knex.schema.table( 'offices', table => {
		table.dropColumn( 'roles' );
	});
};
