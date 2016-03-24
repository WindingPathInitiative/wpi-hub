'use strict';

exports.up = ( knex, Promise ) => {
	return knex.schema.createTable( 'users', ( table ) => {
		var membershipTypes = [ 'None', 'Trial', 'Full', 'Expelled' ];

		table.increments().primary();
		table.integer( 'portalID' ).nullable().index();
		table.string( 'firstName' ).notNull();
		table.string( 'lastName' ).notNull();
		table.string( 'nickname' ).nullable();
		table.string( 'email' ).notNull().index();
		table
			.enum( 'membershipType', membershipTypes )
			.notNull()
			.defaultTo( 'Full' );
		table.string( 'membershipNumber', 12 ).notNull().index().unique();
		table.date( 'membershipExpiration' ).notNull().index();
		table.integer( 'orgUnit' ).nullable().index();
	});
};

exports.down = ( knex, Promise ) => {
	return knex.schema.dropTable( 'users' );
};
