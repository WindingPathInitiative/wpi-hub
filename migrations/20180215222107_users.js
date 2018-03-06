'use strict';

exports.up = ( knex, Promise ) => {
	return knex.schema.createTable( 'users', ( table ) => {
		var membershipTypes = [ 'None', 'Trial', 'Full', 'Suspended', 'Expelled' ];

		table.increments().primary();
		table.string( 'portalID', 36).index().unique();
		table.string( 'firstName' ).notNullable();
		table.string( 'lastName' ).notNullable();
		table.string( 'nickname' );
		table.text( 'address' );
		table.string( 'email' ).notNullable().index();
		table
			.enum( 'membershipType', membershipTypes )
			.notNullable()
			.defaultTo( 'Full' );
		table.string( 'membershipNumber', 15 ).notNullable().index();
		table.date( 'membershipExpiration' ).notNullable().index();
		table.integer( 'orgUnit' ).index();
	});
};

exports.down = ( knex, Promise ) => {
	return knex.schema.dropTable( 'users' );
};
