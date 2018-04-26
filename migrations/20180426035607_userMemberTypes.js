'use strict';

exports.up = function(knex, Promise) {
	return knex.schema.alterTable('users', (table) => {
		var membershipTypes = [ 'None', 'Full', 'Suspended', 'Expelled', 'Resigned' ];
		table
			.enum( 'membershipType', membershipTypes )
			.notNullable()
			.defaultTo( 'None' ).alter();
	});
};

exports.down = ( knex, Promise ) => {
	return knex.schema.alterTable('users', (table) => {
		var membershipTypes = [ 'None', 'Trial', 'Full', 'Suspended', 'Expelled' ];
		table
			.enum( 'membershipType', membershipTypes )
			.notNullable()
			.defaultTo( 'None' ).alter();
		
	});
};

