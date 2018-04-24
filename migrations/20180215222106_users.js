'use strict';

exports.up = function(knex, Promise) {
	return knex.schema.alterTable('users', (table) => {
		var membershipTypes = [ 'None', 'Trial', 'Full', 'Suspended', 'Expelled' ];
		table
			.enum( 'membershipType', membershipTypes )
			.notNullable()
			.defaultTo( 'None' ).alter();
		table.string( 'portalID', 36 ).alter();
		table.string( 'membershipNumber', 15 ).notNullable().alter();
		
	});
};

exports.down = ( knex, Promise ) => {
	return knex.schema.alterTable('users', (table) => {
		var membershipTypes = [ 'None', 'Trial', 'Full', 'Suspended' ];
		table
			.enum( 'membershipType', membershipTypes )
			.notNullable()
			.defaultTo( 'Full' ).alter();
		table.integer( 'portalID' ).alter();
		table.string( 'membershipNumber', 12 ).notNullable().alter();
		
	});
};

