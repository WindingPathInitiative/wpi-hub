'use strict';

exports.up = ( knex, Promise ) => {
	return knex.schema.table( 'users', table => {
		table.text( 'address' );
	});
};

exports.down = ( knex, Promise ) => {
	return knex.schema.table( 'users', table => {
		table.dropColumn( 'address' );
	});
};
