
exports.up = ( knex, Promise ) => {
	return knex.schema.createTable( 'org_units', ( table ) => {
		var unitTypes = [ 'Venue', 'Domain', 'Region', 'Nation' ];

		table.increments().primary();
		table.string( 'name' ).notNull();
		table.string( 'location' ).nullable();
		table.integer( 'parentID' ).index();
		table.string( 'website' ).nullable();
		table.enum( 'type', unitTypes ).notNull();
		table.text( 'defDoc' ).nullable();
	});
};

exports.down = ( knex, Promise ) => {
	return knex.schema.dropTable( 'org_units' );
};
