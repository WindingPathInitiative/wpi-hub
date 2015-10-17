
exports.up = ( knex, Promise ) => {
	return knex.schema.createTable( 'users', ( table ) => {
		var membershipTypes = [ 'None', 'Trial', 'Full', 'Expelled' ];

		table.increments().primary();
		table.string( 'firstname' ).notNull();
		table.string( 'lastname' ).notNull();
		table.string( 'nickname' ).nullable();
		table.string( 'email' ).notNull().index();
		table
			.enum( 'membershipType', membershipTypes )
			.notNull()
			.defaultTo( 'Full' );
		table.string( 'membershipNumber', 10 ).notNull().index();
		table.date( 'membershipExpiration' ).notNull().index();
		table.integer( 'portalId' ).notNull().index();
		table.integer( 'orgUnit' ).nullable().index();
	});
};

exports.down = ( knex, Promise ) => {
	return knex.schema.dropTable( 'users' );
};
